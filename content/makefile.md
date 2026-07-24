# D. 更多关于 makefile 与编译器选项

<!-- toc -->

:::warning 本章可能已过时

这部分可能需要大修，且其中一些建议的工具或做法可能已被弃用。

:::

## 简介 {#sec-intro}

虽然我在[环境搭建](setup.html)一节对 makefile 和编译器标志做了快速介绍，但更深入地审视这些东西可能也很有用。所以我会更详细地展示并解释 Tonc 使用的 makefile，以及关于 makefile 和编译器/链接器选项的其他一些小事情。我希望这能给你足够的弹药去理解那些已有的 makefile，并让你能自己搞清 make 过程中更复杂的方面。本页很难替代关于构建工具 make、汇编器 as、编译器 gcc 和链接器 ld 的完整文档，但目前只能将就。你可以在 [GNU Manuals Online](https://www.gnu.org/manual/manual.html) 获取这些工具的完整文档。你可能也会对 MrMrIce 的 make 教程感兴趣，它可以在 [gbadev.org](http://www.gbadev.org) 的文档区找到。

顺便说一句，我在这块不是专家。我对 makefile 和编译器选项知道几个小技巧，但也仅此而已。如果你有改进我的 makefile 的建议，请告诉我。

## 我的标准 makefile {#sec-make}

:::warning 更新提示

截至 20060428，我使用的是不同风格的 makefile，这意味着本节现在大体上过时了。等它排到我优先级栈顶时我会更新（那可能要一阵子）。

:::

下面是我的 int_demo 演示的 makefile。这是一个中等复杂的 makefile，使用了汇编器、隐式规则和模式替换。你在这里看到的东西对大多数日常 makefile 应该足够了。开始前两点说明：这是一个用于 devkitARM 的 makefile。让它适用于 DKA 的说明用注释标出。

```makefile
#
# int_demo.mak
#
# makefile for a simple interrupt demo


# --- Project details ---
PROJ    := int_demo
EXT     := gba
UDIR    := ../toncllib

SFILES  := $(UDIR)/single_ints.s
CFILES  := int_demo.c gba_pic.c \
    $(UDIR)/core.c $(UDIR)/interrupt.c $(UDIR)/keypad.c $(UDIR)/vid.c

SOBJS   := $(SFILES:.s=.o)
COBJS   := $(CFILES:.c=.o)
OBJS    := $(SOBJS) $(COBJS)

#--- Tool settings ---
CROSS   := arm-none-eabi-                    # use arm-agb-elf- for DKA
AS      := $(CROSS)as
CC      := $(CROSS)gcc
LD      := $(CROSS)gcc
OBJCOPY := $(CROSS)objcopy


MODEL   := -mthumb-interwork -mthumb
SPECS   := -specs=gba.specs

ASFLAGS := -mthumb-interwork
CFLAGS  := -I./ -I$(UDIR) $(MODEL) -O2 -Wall
LDFLAGS := $(SPECS) $(MODEL)

#--- Build steps ---
build : $(PROJ).$(EXT)

$(PROJ).$(EXT) : $(PROJ).elf
    @$(OBJCOPY) -v -O binary $< $@
    -@gbafix $@

$(PROJ).elf : $(OBJS)
    @$(LD) $^ $(LDFLAGS) -o $@

#COBJS compiled automatically via implicit rules
#$(COBJS) : %.o : %.c
#   $(CC) -c $< $(CFLAGS) -o $@

$(SOBJS) : %.o : %.s
    $(AS) $(ASFLAGS) $< -o $@


# --- Clean ---
.PHONY : clean
clean : 
    @rm -fv $(COBJS) $(SOBJS)
    @rm -fv $(PROJ).$(EXT) 
    @rm -fv $(PROJ).elf 
```

如你所见，我把文件分成了四个部分：项目细节、工具设置、构建和清理。我会按出现顺序过一遍。

### 1：项目细节 {#ssec-make-proj}

```makefile
PROJ    := int_demo
EXT     := gba
UDIR    := ../tonclibs

SFILES  := $(UDIR)/single_ints.s
CFILES  := int_demo.c gba_pic.c \
    $(UDIR)/core.c $(UDIR)/interrupt.c $(UDIR)/keypad.c $(UDIR)/vid.c

SOBJS   := $(SFILES:.s=.o)
COBJS   := $(CFILES:.c=.o)
OBJS    := $(SOBJS) $(COBJS)
```

这些全都是变量定义。变量可以用两种方式定义（见 make 手册 7.2："The Two Flavors of Variables"）：

```makefile
XX  = yy
AA := bb
```

第一种风味（`=`）是<dfn>递归展开</dfn>变量；第二种（`:=`）是<dfn>简单展开</dfn>变量。无论哪种情况，每当你现在写 `$(XX)`，构建工具都会把它替换成 `yy`。是的，括号是强制的。两者的区别可以通过看看如果你这样做会发生什么来弄清。

```makefile
XX = $(XX) -c
AA := $(AA) -c
```

你希望这表现得像 C 的 `+=` 运算符，但在第一种情况下展开是递归进行的，意味着你会得到一个无限循环。第二种版本做了你预期的事。简单展开变量让事情更可预测，这是件好事。更多细节见 make 手册。哦，如果你在疑惑，赋值运算符在 makefile 里也可用。

在这个例子中，我定义了项目的名字（int_demo）、扩展名（gba）和我存放所有工具例程的目录（../libtonc）的变量。这样做是个好习惯，因为你可以修改并用它适配另一个项目，而不必太费劲。

第二部分定义了项目的源文件（不是目标文件，而是实际的 C 和汇编文件）。注意许多名字里 `$(UDIR)` 的用法。还要注意 `CFILES` 的定义用反斜杠（`\`）分成了两行。不过，当你这样做时，请*绝对*确保它是该行最后一个字符。如果你在它后面放了一个空格，你会后悔的。有些编辑器有一个选项可以显示不可打印字符；如果你怀疑这类错误（对 tab 要求也适用），可以试试。

第三部分才有意思。形如

```makefile
$(var:a=b)
```

的东西叫<dfn>替换引用</dfn>，是模式替换的众多形式之一。在这种情况下，它查看变量 *var*，如果在某个词的末尾找到字符串 *a*，它就会被字符串 *b* 替换。我用它把 .s 和 .c 文件列表转换成目标文件列表。GNU Make 充满了像这样的字符串变换命令。看看 libtonc.mak 找找其他的。

### 2：工具设置 {#ssec-make-tool}

```makefile
CROSS := arm-none-eabi-                      # use arm-agb-elf- for DKA
AS      := $(CROSS)as
CC      := $(CROSS)gcc
LD      := $(CROSS)gcc
OBJCOPY := $(CROSS)objcopy


MODEL   := -mthumb-interwork -mthumb
SPECS   := -specs=gba.specs

ASFLAGS := -mthumb-interwork
CFLAGS  := -I./ -I$(UDIR) $(MODEL) -O2 -Wall
LDFLAGS := $(SPECS) $(MODEL)
```

更多变量。首先，我列出用于汇编（`arm-none-eabi-as`）、编译（`arm-none-eabi-gcc`）和链接（`arm-none-eabi-gcc`）的工具。注意我用了同一个程序来编译和链接。你也可以用真正做链接的命令（`arm-none-eabi-ld`），但如果你那样做，你得告诉它用什么标准库以及在哪里找它们。gcc 替我们做了这些，省了我们很多麻烦。为了表明它在概念上确实是不同的步骤，我为链接步骤用了不同的变量名。现在，原则上变量名随你选，你大可管它们叫 HUEY、LOUIS 和 DEWEY，但 AS、CC 和 LD 是约定俗成的，所以坚持用它们算是给全世界做了件好事。而且使用这些名字还有第二个理由，我稍后会讲。此外，用一个单独的变量表示命令前缀（那个 `CROSS` 变量）让切换到另一个 devkit 更容易。抽象是你的朋友。

其余的是汇编器、编译器和链接器标志的列表。我想稍后告诉你它们做什么，因为这本身与 make 过程无关。不过，这样做是标准做法。再次，通过对这些东西（尤其用这些确切的名字）使用变量，而非把它们加到实际的构建命令中，让切换到需要其他标志的东西更容易。抽象是个非常好的朋友。

### 3：构建命令 {#ssec-make-cmd}

```makefile
build : $(PROJ).$(EXT)

$(PROJ).$(EXT) : $(PROJ).elf
    @$(OBJCOPY) -v -O binary $< $@
    -@gbafix $@

$(PROJ).elf : $(OBJS)
    @$(LD) $^ $(LDFLAGS) -o $@

#COBJS compiled automatically via implicit rules
#$(COBJS) : %.o : %.c
#   $(CC) $(CFLAGS) -c $< -o $@

$(SOBJS) : %.o : %.s
    $(AS) $(ASFLAGS) $< -o $@
```

现在来看真正的工作。实际的构建过程由若干规则组成。如果你忘了规则长什么样，它又在这儿了：

```makefile
target : prerequisite
    command
```

这里要记住的一件事是，命令*必须*以 TAB 而非空格开头！总之，命令只有当目标过期时才会运行。当目标不存在或比先决条件更旧时就是这种情况。默认情况下，makefile 中的第一条规则启动构建链，但你可以在命令行（或项目设置）从另一条规则开始。让我们逐条追溯这些规则。

它从 `build` 规则开始，它有一个先决条件 `int_demo.gba`。这也有一条规则，且需要 `int_demo.elf`，而后者又需要`目标列表`。目标列表由两部分组成，`COBJS` 和 `SOBJS`。它们规则中的百分号（'%'）使它们成为<dfn>模式规则</dfn>。以 `SOBJS` 为例，规则说对于列表中每个以 '.o' 结尾的文件，其先决条件是对应的 '.s' 文件。由于源文件有先决条件，到这里 `build` 链就结束了。现在命令登场，以栈展开的方式。

在几乎所有的命令中，你会看到带美元符号的未知东西：`$^`、`$<` 和 `$@`。这些是<dfn>自动变量</dfn>。它们分别指代完整的先决条件、先决条件中的单项，以及目标。关于某些命令还要注意它们前面的连字符（'-'）和 at 符号（'@'）。'@' 抑制该行的回显。连字符让 make 忽略错误。我在 gbafix 命令里用它来让 makefile 即使你没有这个工具也能继续运行。

细心的读者可能注意到编译 C 文件的行被注释掉了。那么文件没有规则怎么能编译呢？通过<dfn>隐式规则</dfn>。对于相当多的后缀，GNUmake 知道如何构建它们。例如，如果你需要一个目标文件 *foo.o* 而 *foo.c* 在附近，它会使用规则

```makefile
$(CC) $(CPPFLAGS) $(CFLAGS) -c $< -o $@
```

对汇编文件也有一条隐式规则，只是它用 `AS` 和 `ASFLAGS`，这也是我为什么用那些名字。你可以在 make 手册中找到隐式规则及其所用变量的完整列表。

### 4：清理 {#ssec-make-clean}

```makefile
# --- Clean ---
.PHONY : clean
clean :
    @rm -fv $(COBJS)
    @rm -fv $(PROJ).$(EXT)
    @rm -fv $(PROJ).elf
```

这条规则与其他的分离，用于移除项目的输出和中间产物（但不是工具对象，因为它们也可能在另一个项目中使用）。它真的很简单：rm 是移除东西的命令，标志告诉它即使文件不存在也继续（`-f`）并显示它在做什么（`-v`）。就这些。嗯，差不多。还有一件事，即 `.PHONY` 指令。记得我说过命令只有当目标不存在或比其先决条件更旧时才运行。由于目标（clean）不存在，它总是过期的，命令总是运行。但如果*确实*有一个叫 clean 的文件呢？因为没有先决条件，命令永远不会运行。`.PHONY` 指令用于表明目标只是名义上的目标，命令应该总是被执行。

makefile 还有更多好玩的。你可以用运行其他 makefile 的 makefile（这实际上正是 tonc.mak 的设置方式），或在其他 makefile 中包含它们。最后一种能让你的生活轻松很多。例如，通过恰当使用变量，步骤 3 和 4 在不同项目之间很少变化。这意味着你可以把它们放进一个主 makefile，并包含在所有你的项目 makefile 中，在其中你只需写下真正针对当前项目的东西（这方面的例子见 [HAM](http://www.ngine.de)）。抽象想给你生宝宝。

通过模式替换和通配符规则，你几乎可以写出会自己写的 makefile！（见 [devkitARM](https://www.devkitpro.org) 示例代码）。makefile 能力的全部范围超出了本教程的范围，但相信我，这里还有更多很酷的东西。

## 常用编译器标志 {#sec-flags}

知道如何写一个能用的 makefile 只是让 GNU 工具工作的问题的一部分。更重要的是知道你能对汇编器、编译器和链接器使用哪些选项。在 IDE 里，你可以通过在勾选框和列表框里选它们等来启用这些。但对命令行工具就没这运气了，在这里你必须通过包含某些标志来设置所有选项。关键是知道用哪些标志。我不会把它们每一个都列出来，因为确实有成百上千个标志。但我会列出你在 GBA 编程中最可能看到的那些。

- `-c`:   (gcc) 编译成目标文件，但不链接。
- `-E`:   (gcc) 在预处理阶段后停止。
- `-g`:   (as, gcc) 为 gdb 调试器生成调试信息。我自己还没用过。
- `-Idir`:   (gcc) 把目录 dir 加入到搜索头文件的目录列表中。（顺便说一句，那是大写的 'i'）
- `-llibrary`:   (gcc, ld) 链接时搜索名为 *library* 或 *liblibrary.a* 的库。重要的库有 libm（数学库）、libgcc、libc 和 libstdc++；后三个在您用 `gcc` 作为链接器而非直接调用 `ld` 时会自动链接。而那是小写的 'L'，顺便说一句。"lI1"、"oO0"，有时候我真恨拉丁字母。
- `-Ldir`:   (gcc, ld) 把目录 dir 加入到搜索代码库的目录列表中。
- `-M`:   (gcc) `-M` 系列标志为头文件生成依赖信息。通常当你创建规则时，你只提到源文件，它们在被修改时会重新编译。但当你修改那个文件所包含的头文件时，文件本身仍被认为是最新的。你可以自己为头文件创建规则，或让 make 用这些标志替你做。不幸的是，我还未能让它们对我起作用。
- `-Map mapfile`:   (ld) 创建一个<dfn>映射文件</dfn>，它指示链接器把你的函数和全局变量放在哪里。由于它是纯链接器选项，用 gcc 链接时需要用 -Wl,-Map,filename。
- `-marm, -mthumb, -mthumb-interwork`
:   (as, gcc, ld) 指示要为哪种 CPU 型号（ARM 或 Thumb）编写目标文件。默认是 ARM。用 `-mthumb-interwork` 你允许 ARM 和 Thumb 代码混用，即使你实际上没用到也该允许。这个标志在 devkitARM 下实际上是*必需*的。
- `-nostartfiles`:   (gcc, ld) 链接时不要使用标准系统启动文件。如果你想链接自定义的 *crt0.o*，你会非常想要这个。（不过，你是否想要自定义的 crt0.o 是另一回事。）
- `-o file`:   (as, gcc, ld) 把输出放在文件 file 中。
- `-Onum`:   (gcc) 启用优化级别 `num`，其中 `num` 通常是 `g`、`1`、`s`、`2` 或 `3`。如果你想用内联函数，你至少需要一级优化。详见 gcc 手册。
- `-S`:   (gcc) 编译但不汇编。这会给你刚编译的 C 文件的汇编文件。对弄清 ARM 汇编如何工作非常有用，你至少该做一次。
- `-specs=specfile`:   (gcc) 使用 specfile 来决定需要传给 gcc 子进程（`as`、`cc1`、`cc1plus`、`ld`）哪些开关，而非默认 specs。（gcc.info，第 5556 行。看在 IPU 的份上，各位，你们就不看手册吗？要知道那才 26k 行。）
- `-T scriptfile`:   (ld) 使用 scriptfile 作为链接器脚本。（像 Jeff Frohwein 的 lnkscript。）
- `-Wall`:   (as, gcc) 启用常见警告。形如 `-Wfoo` 的选项实际上用于各种警告。
- `-Wl,opts`:   (gcc) 把选项传给链接器；opts 是逗号分隔的列表。
