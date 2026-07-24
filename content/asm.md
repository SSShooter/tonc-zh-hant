# 23. ARM 汇编速成

<!-- toc -->

## 引言 {#sec-intro}

大致来说，编程语言可以分为 4 类。最底层是机器码：CPU 解码为指令去执行的原始数字。往上一层是汇编。本质上就是用单词表示的机器码：每条汇编指令对应一条机器码指令。再往上是 C 这样的编译型语言，它们使用结构化的语言元素，读起来更像英文，但需要编译成机器码才能运行。最后是脚本语言，比如 PHP（通常还有 VB 和 Java），它们通过解释器来运行，解释器被配置成去执行对应效果的机器码。

每往上爬一级阶梯，程序的可读性和可移植性都会提升，代价则是运行速度和程序体积。过去，程序员都是“真正的程序员”，因为时钟频率和/或内存的限制，他们用机器码或汇编工作。对 PC 来说，那样的日子早已远去，大部分工作都改用高级语言完成了。平心而论，这是件好事：代码能写得更快，维护起来也更容易。不过，仍有少数场合是高级语言力有不逮的。GBA 掌机拥有 16.7MHz 的 CPU 和不到 1 MB 的工作内存（work RAM），就是其中之一。在这里，最高级语言的开销会让你付出惨重代价——假如它真能跑起来的话。这就是为什么大部分 GBA 开发都用 C/C++ 完成，有时它被亲切地叫做“可移植的汇编”，因为它仍然具备直接操作内存的能力。但有时即便这样也不够。有时你真的必须让每一个周期都物尽其用。而为此，你需要**汇编**。

如今，在某些圈子里，“汇编”这个词能用来吓唬胆小的程序员。因为它和 CPU 绑得如此之紧，你能让它做任何事；但这也意味着你*必须*亲手做完所有事。贴近硬件同时也意味着你绕过了高级语言可能具备的所有安全机制，于是搞坏东西要*容易*得多。所以没错，它更难、也更危险。虽然有些人可能更喜欢“冒险”这个说法。

要用汇编编程，你需要了解处理器到底是怎么工作的，并用它能理解的方式去写，而不是依赖编译器或解释器替你代劳。这里没有结构化的 for 或 while 循环，甚至连 if/else 分支都没有，只有 `goto`；没有带继承的结构体或类，甚至连数据类型也基本缺席。这是无政府状态，但正是这种官僚主义的缺失，使得快速代码成为可能。

撇开速度/体积问题不谈，学习汇编还有别的理由。正如我所说，它逼着你去真正*理解* CPU 是怎么运作的，而这份知识在你的 C 代码里同样用得上。一个好例子就是变量“最佳”数据类型的问题。因为 ARM 处理器是 32 位的，它在大多数事情上偏爱 int，其他类型会更慢，有时慢得多。虽然这一点从处理器本身的描述里就很明显，但汇编知识能向你展示它们*为什么*更慢。

第三个理由，而且不算无足轻重，纯粹是为了整体的酷炫感 <kbd>=B)</kbd>。它比高级语言更难这个事实本身，就应该能吸引你内心那个热衷于此类挑战的极客。语句本身的简洁也有一种美学上的质感：不用和类、不同的循环风格、运算符优先级之类的事纠缠——一行，一条 opcode，参数从不超过区区几个。

总之，关于本章。一份完整的汇编文档无异于一整本 CPU 用户手册。那本身就需要一整本书，这不是我的目标。我这里的意图是给你一个（但很详尽的）ARM 汇编入门。我会讲解 ARM 和 Thumb 指令集里最重要的指令，你能用它们做什么、不能做什么（以及一点点关于“为什么”的说明）。我还会介绍如何使用 GCC 的汇编器来真正汇编代码，以及如何让你的汇编文件和 C 文件协同工作。最后，我会给出一个快速内存拷贝器的例子，作为 ARM 和 Thumb 代码的一个示范。

有了这些信息，你应该能做很多事情，或者至少知道如何去利用市面上各种参考资料。本章并非孤岛，我假定你手头已经拥有下列文档中的部分或全部：

- 相当庞大的官方 ARM7TDMI 技术手册：[DDI0210B.pdf](https://documentation-service.arm.com/static/5f4786a179ff4c392c0ff819?token=)。
- GBATEK 的 ARM CPU 参考：[ARM + Thumb](https://problemkaputt.de/gbatek.htm#armcpureference)。
- 官方 ARM 速查表（PDF）：[ARM + Thumb](https://documentation-service.arm.com/static/5ed66080ca06a95ce53f932d?token=)
- Re-ejected 的速查表（PDF）：[GAS](http://www.coranac.com/files/gba/re-ejected-gasref.pdf) / [ARM](http://www.coranac.com/files/gba/re-ejected-armref.pdf) / [Thumb](http://www.coranac.com/files/gba/re-ejected-thumbref2.pdf)。（注意：偶尔有细微的语法出入）
- GNU 汇编器手册：[GAS](http://sourceware.org/binutils/docs/as/index.html)。

如果你想要更多 ARM/Thumb 指南，就得自己去找了。

## 汇编概览 {#sec-asm}

汇编不过是为机器码披上了一层宏语言的外衣。汇编指令和真正的机器码之间存在着一一对应的关系，汇编用 <dfn>助记符</dfn>（mnemonics）来表示处理器能够执行的操作，这比原始二进制要好记得多。把汇编代码转换成机器码的工具叫做<dfn>汇编器</dfn>（assembler）。

### 基本操作 {#ssec-asm-ops}

每个处理器都必须能进行基本的数据处理：算术和位操作。它们还应该具备访问内存的指令，以及为了条件判断和循环等目的而在代码各处跳转的能力。不过，不同处理器做这些事的方式各异，某套指令集中的某些操作可能在另一套里并不存在。举个例子，ARM 缺少一条除法指令，而且无法直接对内存做数据处理。然而，ARM 指令集也有它的好处，比如数量相当可观的通用寄存器和一套简洁的指令集（对于“简洁”的恰当定义而言）。而且它还有一种*非常*巧妙的处理位偏移（bit-shift）的方式。

在下面的片段里，你能找到三套不同汇编语言中的几个加法和内存读取示例：x86（Intel）、68000 和 ARM。基本格式通常是类似“`operation operand1, operand2, ...`”这样的，尽管总有些例外。注意，x86 和 ARM 把目的操作数放在 *Op1*，而 68000 汇编则把它放在最后。寄存器的术语也不同。有些语义是相当通用的，比如加法“`x += y`”在三套里都能见到，但 x86 还有一条对加一专用的特殊指令，而 ARM 里结果寄存器可以和两个操作数都不同。这些差异正对应着处理器实际工作方式的区别！高级语言允许你使用那些指令集里似乎并不存在的操作，但其实它们只是*看起来*存在：编译器/解释器会把它转换成处理器真正能处理的形式。

我必须在这里指出的另一点是：即便对同一个处理器，你写汇编的方式也可能有差异。汇编器并不难写，而且没什么能阻止你使用另一种不同的语法。当然，除了其他程序员的怒火之外。

```armasm
// Some examples
// Addition and memory loads in different assemblies

// === x86 asm ========================================================
add     eax, #2         // Add immediate:   eax += 2;
add     eax, ebx        // Add register:    eax += ebx;
add     eax, [ebx]      // Add from memory: eax += ebx[0];
inc     eax             // Increment:       eax++;

mov     eax, DWORD PTR [ebx]        // Load int from memory:    eax= ebx[0];
mov     eax, DWORD PTR [ebx+4]      // Load next int:           eax= ebx[1];

// === 68000 asm ======================================================
ADD     #2, D0          // Add immediate:   D0 += 2;
ADD     D1, D0          // Add register:    D0 += D1;
ADD     (A0), D0        // Add from memory: D0 += A0[0];

MOVE.L  (A0), D0        // Load int from memory:    D0= A0[0];
MOVE.L  4(A0), D0       // Load next int:           D0= A0[1];

// === ARM asm ========================================================
add     r0, r0, #2      // Add immediate:   r0 += 2;
add     r0, r0, r1      // Add register:    r0 += r1;
add     r0, r1, r2      // Add registers:   r0= r1 + r2;

ldr     r0, [r2]        // Load int from memory:    r0= r2[0];
ldr     r0, [r2, #4]    // Load int from memory:    r0= r2[1];
ldmia   r2, {r0, r1}    // Load multiple:           r0= r2[0]; r1= r2[1];
```

### 变量：寄存器、内存与栈 {#ssec-asm-var}

在高级语言（HLL）里你有变量可用，在汇编里你则拥有寄存器、变量（也就是内存里的特定区间）以及栈。[<dfn>寄存器</dfn>](https://en.wikipedia.org/wiki/Processor_register)本质上是芯片内部的变量，访问起来很快。缺点在于它们通常数量很少，从只有一个到可能几十个不等。大多数程序需要多得多的变量，这就是为什么你也可以把变量放在可寻址的内存里。内存里的字节数比寄存器多得多，但用起来也更慢。注意，寄存器和内存本质上都是**全局**变量，在一个函数里改了它们，程序其余部分也就跟着改了。至于局部变量，你可以用栈。

[<dfn>栈</dfn>](https://en.wikipedia.org/wiki/Stack_(abstract_data_type))是一块被当作——嗯，栈来用的特殊内存区域：一种后进先出（Last-In, First-Out）机制。会有一个名为<dfn>栈指针</dfn>（stack pointer，简称 SP）的特殊寄存器，它保存着栈顶的地址。你可以把变量*压*（push）到栈顶妥善保管，用完了再把它*弹*（pop）出来，从而把寄存器恢复到原先的值。栈的地址（也就是栈顶，即 SP 的内容）并不是固定的：随着代码层级越钻越深，它会增长；往外走时又会收缩。关键在于，每块代码都应该清理好自己留下的痕迹，使栈指针在前后保持一致。否则，就准备好迎接程序其余部分的一场壮观崩溃吧。

举例来说，假设你有函数 `foo()`，它使用了寄存器 A、B、C 和 D。函数 `foo()` 调用了函数 `bar()`，后者也使用了 A、B 和 C，但语境和 `foo()` 不同。为了确保 `foo()` 还能正常工作，`bar()` 在开头把 A、B、C 压入栈，然后按自己的意愿使用它们，结束前再把它们弹回 A、B、C。伪代码如下：

```armasm
// Use of stack in pseudo-asm

// Function foo
foo:
    // Push A, B, C, D onto the stack, saving their original values
    push    {A, B, C, D}

    // Use A-D
    mov     A, #1        // A= 1
    mov     B, #2        // B= 2
    mov     C, #3        // well, you get the idea
    call    bar
    mov     D, global_var0

    // global_var1 = A+B+C+D
    add     A, B
    add     A, C
    add     A, D
    mov     global_var1, A

    // Pop A-D, restoring then to their original values
    pop     {A-D}
    return

// Function bar
bar:
    // push A-C: stack now holds 1, 2, 3 at the top
    push    {A-C}

    // A=2; B=5; C= A+B;
    mov     A, #2
    mov     B, #5
    mov     C, A
    add     C, B

    // global_var0= A+B+C (is 2*C)
    add     C, C
    mov     global_var, C

    // A=2, B=5, C=14 here, which would be bad when we
    // return to foo. So we restore A-C to original values.
    // In this case to: A=1, B=2, C=3
    pop     {A-C}
    return
```

虽然上面的语法像汇编，但它其实不属于任何一套真正的汇编——至少据我所知如此。它同时也是特别*糟糕*的汇编，因为光是在寄存器的使用上就很低效。如果你写出对应的 C 代码并编译它（记得开优化），得到的代码会更好。但这里重点是栈的用法，而不是效率。

你在这里看到的是，`foo()` 把 A、B、C 分别设为 1、2、3（`mov` 意为“move”，通常等同于赋值），然后调用 `bar()`，后者把它们设成别的值，并把一个名为 `global_var0` 的全局变量设为 A+B+C。因为 A、B、C 现在和 `foo()` 里的值不同了，那个函数之后计算就会用到错误的值。为了弥补，`bar()` 用栈来保存并恢复 A、B、C，使得调用 `bar()` 的函数仍能正常工作。注意 `foo()` 也对 A、B、C、D 用了栈，因为调用 `foo()` 的函数可能也想用这些寄存器。

在被调用函数内部堆叠寄存器只是一条*准则*，而非法律。你也可以让调用者去保存/恢复它所用到的变量。你甚至可以完全不用栈，就好像你本来就打算让 A、B、C 改变、把它们当作函数的返回值。只要不在 `bar()` 里手动设置寄存器，A 和 B 实际上就成了函数参数。或者你也可以用栈来传递函数参数、传递返回值，或者寄存器与栈两者混用。关键在于，你完全自由地以任何想要的方式来处理它们。至少，原则上如此。在实践中，原始厂商写有准则，虽然未刻在石头上，但不遵守会被视作不良风格。而如果你打算让代码和编译后的代码对接，你就能看到这种做法有多*糟糕*——因为编译代码*确实*遵守了准则。

### 分支与条件码 {#ssec-asm-jmp}

计算机的正常运作方式是逐条取指令并执行。一个名为<dfn>程序计数器</dfn>（program counter，PC）的特殊寄存器指示着下一条指令的地址。时机一到，处理器读出那条指令，施展魔法，然后把程序计数器递增到下一条。这是个相对直白的过程；而当你能把程序计数器设到一个完全不同的地址、从而改变程序流向时，事情才开始变得有趣。有人会说，只有具备了这种能力，你才算真正是在跟一台“计算机”打交道。

这种重定向的术语叫做<dfn>分支</dfn>（branching），不过“跳转”（jump）这个词也常被使用。借助分支，你可以创建诸如循环（无限循环，谨记）之类的东西，并实现子例程。分支的助记符通常是 `b` 或 `j(mp)` 之类。

```armasm
// Asm version of the while(1) { ... } endless loop

// Label for (possible) branching destination
endless:

    ...         // stuff

    b endless // Branch to endless, for an endless loop.
```

分支的全部威力来自“只在特定<dfn>条件</dfn>满足时才分支”。有了它，你就能写出 if-else 代码块，以及真正能终止的循环。允许的条件取决于处理器，但最常见的有：

- **零**（Z）。如果操作的结果为 0。
- **负**（N）。结果为负（即最高有效位被置位）。
- **进位标志置位**（C）。如果“最最”重要的位被置位（比如 32 位操作中的第 32 位）。
- **算术溢出**（V）。比如两个正数相加却得到一个负数，因为结果太大，寄存器装不下。

这些条件标志存放在<dfn>程序状态寄存器</dfn>（Program Status Register，PSR）里，每条数据处理指令都会根据操作结果去设置这些标志中的一个或多个。分支指令的特殊版本可以利用这些标志来决定是否跳转。

下面你能看到一个简单 for 循环的例子。`cmp` 指令把 `A` 和 16 比较，并相应地设置 PSR 标志。指令 `bne` 意为“如果不相等则分支”（branch if Not Equal），对应 Z 标志为清零的状态。零标志之所以介入，是因为两个数的相等与否，取决于它们之差是否为零。所以，如果 `A` 和 16 之间存在差值，我们就跳回 `for_start`；如果没有，就继续执行后面的代码。

```armasm
// Asm version of for(A=0; A != 16; A++)

    mov     A, #0
// Start of for-loop.
for_start:

    ...             // stuff

    add     A, #1
    cmp     A, #16  // Compare A to 16
    bne for_start   // Branch to beginning of loop if A isn't 16
```

条件码的数量和名字取决于平台。ARM 有 16 个，但我稍后会讲到它们。

### 示例：GCC 生成的 ARM 汇编 {#ssec-asm-gcc}

在正式进入 ARM 汇编本身之前，我想先给你看一个真实生活中的例子。汇编是构建流程的一个中间步骤，你可以使用“`-S`”或“`-save-temps`”标志来截取 GCC 的汇编输出。这让你有机会看看编译器到底在做什么，对比某个算法的 C 版本与汇编版本，并为如何不平凡地用汇编写东西（比如函数调用、结构体、循环等）提供快速指引。本节是可选的，你未必能理解这里的所有内容，但它仍然极具教育意义。

```Makefile
# Makefile settings for producing asm output
    $(CC) $(RCFLAGS) -S $<
```

```c
// gen_asm.c :
//   plotting two horizontal lines using normal and inline functions.
#include <tonc.h>

void PlotPixel3(int x, int y, u16 clr)
{
    vid_mem[y*240+x]= clr;
}

int main()
{
    int ii;

    // --- using function ---
    ASM_CMT("using function");
    for(ii=0; ii<240; ii++)
        PlotPixel3(ii, 16, CLR_LIME);

    // --- using inline ---
    ASM_CMT("using inline");
    for(ii=0; ii<240; ii++)
        m3_plot(ii, 12, CLR_RED);

    while(1);

    return 0;
}
```

```armasm
@@ gen_asm.s :
@@ Generated ASM (-O2 -mthumb -mthumb-interwork -S)
@@ Applied a little extra formatting and comments for easier reading.
@@ Standard comments use by @; my comments use @@

@@ Oh, and DON'T PANIC! :)

    .code   16
    .file   "gen_asm.c"     @@ - Source filename (not required)
    .text                   @@ - Code section (text -> ROM)

@@ <function block>
    .align  2               @@ - 2^n alignment (n=2)
    .global PlotPixel3      @@ - Symbol name for function
    .code   16              @@ - 16bit Thumb code (BOTH are required!)
    .thumb_func             @@ /
    .type   PlotPixel3, %function   @@ - symbol type (not req)
@@ Declaration : void PlotPixel3(int x, int y, u16 clr)
@@ Uses r0-r3 for params 0-3, and stack for param 4 and over
@@   r0: x
@@   r1: y
@@   r2: clr
PlotPixel3:
    lsl     r3, r1, #4      @@ \
    sub     r3, r3, r1      @@ - (y*16-1)*16 = y*240
    lsl     r3, r3, #4      @@ /
    add     r3, r3, r0      @@ - (y*240+x)
    mov     r1, #192        @@ - 192<<19 = 0600:0000
    lsl     r1, r1, #19     @@ /
    lsl     r3, r3, #1      @@ - *2 for halfword, not byte, offset
    add     r3, r3, r1
    @ lr needed for prologue
    strh    r2, [r3]        @@ store halfword at vid_mem[y*240+x]
    @ sp needed for prologue
    bx  lr
    .size   PlotPixel3, .-PlotPixel3    @@ - symbol size (not req)
@@ </ function block>

    .align  2
    .global main
    .code   16
    .thumb_func
    .type   main, %function
main:
    push    {r4, lr}            @@ Save regs r4, lr
    @ --- using function ---    @@ Comment from ASM_CMT, indicating
    .code   16                  @@   the PlotPixel3() loop
    mov     r4, #0              @@ r4: ii=0
.L4:
        mov     r2, #248        @@ - r2: clr= 248*4= 0x03E0= CLR_LIME
        lsl     r2, r2, #2      @@ /
        mov     r0, r4          @@ r0: x= ii
        mov     r1, #16         @@ r1: y= 16
        add     r4, r4, #1      @@ ii++
        bl      PlotPixel3      @@ Call PlotPixel3 (params in r0,r1,r2)
        cmp     r4, #240        @@ - loop while(ii<240)
        bne .L4                 @@ /
    @ --- using inline ---      @@ Comment from ASM_CMT, indicating
    .code   16                  @@   the m3_plot() loop
    ldr     r3, .L14            @@ r3: starting/current address (vid_mem[12*240])
    ldr     r2, .L14+4          @@ r2: terminating address (vid_mem[13*240])
    mov     r1, #31             @@ r1: clr (CLR_RED)
.L6:
        strh    r1, [r3]        @@ - *r3++ = clr
        add     r3, r3, #2      @@ /
        cmp     r3, r2          @@ - loop while(r3<r2)
        bne .L6                 @@ /
.L12:
    b   .L12
.L15:
    .align  2
.L14:
    .word   100669056       @@ 0600:1680 =&vid_mem[12*240]
    .word   100669536       @@ 0600:1886 =&vid_mem[13*240]
    .size   main, .-main

    .ident  "GCC: (GNU) 4.1.0 (devkitARM release 18)"
```

在初次看到一份不平凡的汇编文件的那点震惊过去之后，即便你对汇编一无所知，或许也能注意到几件事。

- 首先，汇编比 C 文件长得多。这并不奇怪，因为每行只能有一条指令。虽然这让文件变长了，但也让每一行更容易解析。

- 有四种基本类型的行格式：标签（以冒号“:”结尾的行）、指令，以及以句点开头或不以句点开头的行。以句点开头的指令并非真正的指令，而是<dfn>伪指令</dfn>（directives）；它们是给汇编器的提示，不属于 CPU 的指令集。因此，你可以预期它们在不同的汇编器之间会有所差异。

  真正的指令通常由一个助记符（`add`、`ldr`、`b`、`mov`）打头，后跟寄存器标识符、数字或标签。稍加思考，你应该就能拼凑出每一条大概是做什么的。比如 `add` 执行加法，`ldr` 从内存读取某物，`b` 分支（即跳转到另一个内存地址），而 `mov` 做赋值。

- 函数结构与调用方式。在 GAS 里，一个函数前面会有一堆伪指令，用于对齐、代码段和指令集，以及一个“.global”伪指令让它对外可见。当然，还要有一个标记函数开始的标签。注意，对于 thumb 函数，除了“.code 16”或“.thumb”之外，还需要一个“.thumb_func”伪指令。GCC 也会插入大小信息，但这不是必需的。

  函数的调用与返回使用 `bl` 和 `bx` 指令。除了我在额外注释里写的，这段代码里看不太清楚的一点是：函数的参数被放在 r0-r3 寄存器里。你绝对看不到的是，如果有超过 4 个参数，它们会被放在栈上，而返回值则放在 r0 里。

  你*同样*看不到的是，r0-r3（以及 r12）在每个函数里都被预期会被破坏，所以调用它们的函数如果想在调用后还用这些值，就应该先把它们保存起来。其余寄存器（r4-r15）则应该由被调用函数压入栈。函数调用的标准流程可以在 [AAPCS](https://github.com/ARM-software/abi-aa/releases/download/2023Q3/aapcs32.pdf) 中找到。如果违背这个标准，在你试图把代码和 C 或其他汇编结合时，就会把事情搞砸。

- 加载 CLR_LIME 颜色（0x03E0）并不是一步到位，而是分散在两条指令里：一条 mov 和一次移位。为什么不一次就移进去？嗯，因为做不到。ARM 架构只允许字节大小的立即数；更大的东西必须用别的方式构造。这个我稍后会回头再讲。

- 我想提的最后一点，是 `PlotPixel3()` 循环相对于 `m3_plot()` 循环的性能，你能在汇编里找到它，因为我用了一个能在 C 里写汇编注释的宏。`m3_plot()` 循环包含 4 条指令。`PlotPixel3()` 循环则用掉 8 条，外加函数本身额外的 10 条。那就是 4 条指令对阵 18 条指令。C 代码*看起来*几乎一模一样，所以到底怎么回事？

  欢迎来到*函数调用开销*的奇妙世界。原则上，你只需要较短循环里的那些指令：一次存储、一次为下一目标地址的加法、一次比较和一次循环分支。因为 `m3_plot()` 被内联了，编译器能看到所需仅此而已，于是相应地把循环优化掉了。

  相比之下，因为 `PlotPixel()` 是一个完整的函数，调用者无从得知它内部的代码，因此毫无优化的可能。循环在*每一次迭代*中都必须重置寄存器，因为 `PlotPixel()` 会破坏它们，这就让 `main()` 里的循环不必要地变长了。再者，`PlotPixel3()` 并不知道会在什么条件下被调用，所以它那边也没有任何优化。这意味着每一轮迭代都要重新拼凑目标地址，而不是像内联版本那样简单地递增它。总而言之，你得到了一个几乎慢 4 倍的线条绘制器，纯粹是因为你为一个单行的代码用了函数，而不是通过宏或内联函数把它内联。虽然谁都能告诉你这种事会发生，但真正看到其中的差异，留下的印象要深刻得多。

这份代码里还能学到更多东西，但我暂时就讲这么多。主要目的是向你展示汇编（这里是 Thumb 汇编）长什么样。在这小段代码里，你已经能看到构成一个完整程序的诸多要素。即便缺少变量标识符有点恼人，你也应该能跟着代码走，就像读 C 程序那样。瞧，其实也没那么糟，对吧？

:::warning 关于“照例子学”

看别人的代码（这里是 GCC 的汇编）是学习如何把事情做成的好办法，但它*不能*替代手册。它也许能向你展示如何完成某件事，但总存在把事情做错或做得低效的危险。编程几乎从来都不简单，你很可能会漏掉重要的细节：编译器可能没有正确优化，你也可能误读数据，等等。这种学习方式常常导致[ cargo-cult 编程](http://www.catb.org/~esr/jargon/html/C/cargo-cult-programming.html)（盲目崇拜式编程），往往弊大于利。如果你想要这类问题的例子，去看看几乎所有其他的 GBA 教程，以及大量现存的 GBA 演示代码吧。

:::

### 汇编汇编代码 {#ssec-gen-as}

GNU 工具链的汇编器叫做 GNU 汇编器，或 GAS，工具名是 `arm-none-eabi-as`。你可以直接调用它，也可以用你熟悉的 `arm-none-eabi-gcc` 作为入口。后者大概是更好的选择，因为它允许使用 C 预处理器，加上“`-x assembler-with-cpp`”。没错，这样一来你就可以用宏、C 风格的注释*以及* #include（如果你愿意的话）。一条用于汇编的规则可能长这样：

```armasm
AS      := arm-none-eabi-gcc
ASFLAGS := -x assembler-with-cpp

# Rule for assembling .s -> .o files
$(SOBJ) : %.o : %.s
    $(AS) $(ASFLAGS) -c $< -o $@
```

这条规则应该能用在 `gcc -S` 生成的输出上。注意，它大概无法在其他汇编器（ARM SDT、Goldroad）下汇编，因为它们对伪指令、注释等有着不同的标准。在我讲完 ARM 汇编本身长什么样之后，我会在[后面](#sec-gas)介绍 GAS 的一些重要伪指令。

## ARM 指令集 {#sec-arm}

ARM 核心是一个 [<dfn>RISC</dfn>](https://en.wikipedia.org/wiki/RISC)（精简指令集计算机，Reduced Instruction Set Computer）处理器。CISC（复杂指令集计算机，Complex Instruction Set Computer）芯片拥有丰富的指令集，单条指令就能做复杂的事；而 RISC 架构则力求更通用化的指令和更高的效率。它们拥有数量相对较多的通用寄存器，数据指令通常用到三个寄存器：一个目的加两个操作数。每条指令的长度相同，简化了解码过程，而且 RISC 处理器追求单周期指令。

ARM 核心实际上能使用两套指令集：32 位指令的 ARM 代码，以及它一个子集的 Thumb 代码，后者指令长 16 位。自然，ARM 集更强大，但因为最常用的指令在两者中都能找到，用 Thumb 编写的算法占用更少内存，并且在内存总线为 16 位时可能实际上更快——对 GBA 的 ROM 和 EWRAM 来说确属如此，这也是为什么大部分代码都被编译成 Thumb。本节的重点会放在 ARM 集上，学习 Thumb 基本上就是去弄清哪些事情你再也做不了。

GBA 处理器的全名是 [ARM7TDMI](https://en.wikipedia.org/wiki/ARM7TDMI)，意思是它是 ARM 7 代码（又称 ARM v4），能读取 **T**HUMB 代码，拥有 **D**ebug 调试模式和快速 **M**ultiplier 乘法器。本章心里想着这颗处理器，但其中大部分内容也应该适用于 ARM 家族的其他芯片。

### 基本特性 {#ssec-arm-base}

#### ARM 寄存器

ARM 处理器有 16 个 32 位寄存器，名为 r0-r15，其中最后三个通常保留作特殊用途：**r13** 用作栈指针（SP）；**r14** 是<dfn>链接寄存器</dfn>（link register，LR），指示从函数返回的位置；**r15** 是程序计数器（PC）。其余都是自由的，但也有一些约定。头四个，**r0-r3**，是<dfn>参数</dfn>和/或<dfn>暂存寄存器</dfn>（scratch registers）；函数参数放在这里（或栈上），而且这些寄存器被预期会被被调用函数破坏。**r12** 也属于这一类。剩下的 **r4-r11**，也被称为<dfn>变量寄存器</dfn>。

<div class="lblock">
  <table id="tbl:regnames" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:regnames}</b>. Standard and alternative register names.
    </caption>
    <tbody align="center">
      <tr> <th>std</th><th>gcc</th> <th>arm</th><th>description</th> </tr>
      <tr>
        <td>r0-r3</td> <td>r0-r3</td> <td>a1-a4</td>
        <td>argument / scratch</td>
      </tr>
      <tr>
        <td>r4-r7</td> <td>r4-r7</td> <td>v1-v4</td>
        <td>variable</td>
      </tr>
      <tr>
        <td rowspan=2>r8<br>r9</td>
        <td rowspan=2>r8<br>r9</td> <td>v5</td>
        <td>variable</td>
      </tr>
      <tr> <td>v6/SB</td> <td>platform specific</td> </tr>
      <tr>
        <td rowspan=2>r10<br>r11</td>
        <td>sl</td> <td>v7</td> <td> variable </td>
      </tr>
      <tr>
        <td>fp</td> <td>v8</td>
        <td> variable / frame pointer</td>
      </tr>
      <tr>
        <td>r12</td> <td>ip</td> <td>IP</td>
        <td>Intra-Procedure-call scratch</td>
      </tr>
      <tr>
        <td>r13</td> <td>sp</td> <td>SP</td>
        <td>Stack Pointer</td>
      </tr>
      <tr>
        <td>r14</td> <td>lr</td> <td>LR</td>
        <td>Link Register</td>
      </tr>
      <tr>
        <td>r15</td> <td>pc</td> <td>PC</td>
        <td>Program Counter</td>
      </tr>
    </tbody>
  </table>
</div>

#### ARM 指令

几乎所有可能出现的指令都属于以下三类：<dfn>数据操作</dfn>（data operations），比如算术和位操作；<dfn>内存操作</dfn>（memory operations），各种形式的加载和存储；以及用于循环、if 和函数调用时跳来跳去的<dfn>分支</dfn>（branches）。指令的速度也大体遵循这个分法。数据指令通常一个周期完成；内存操作要两三个；分支要三或四个。整个时序问题其实比这*复杂得多*，但作为经验法则它很有用。

#### 所有指令都是条件执行的

在大多数处理器上，你只能让分支带条件，但在 ARM 系统上，你可以把条件附加到*所有*指令上。这对小型 if/else 代码块或复合条件非常方便，否则就非得动用更费时的分支不可。下面的代码包含了那个熟悉的 `max(a, b)` 宏的汇编版本。第一个是传统版本，需要两个标签、两次跳转（虽然只有其中一次被执行）以及真正干活的两条指令。第二个版本只用了两条 `mov`，但多亏了条件执行，只有其中一条会真正被执行。结果就是：它更短、更快，也更可读。

这些种类的条件也不该被盲目使用。即便条件不满足时你不会执行那条指令，你仍然需要把它从内存里读出来，这要花一个周期。作为粗略的准则，跳过的指令达到约 3 条之后，用分支实际上会更快。

```armasm
@ // r2= max(r0, r1):
@ r2= r0>=r1 ? r0 : r1;

@ Traditional code
    cmp     r0, r1
    blt .Lbmax      @ r1>r0: jump to r1=higher code
    mov     r2, r0  @ r0 is higher
    b   .Lrest      @ skip r1=higher code
.Lbmax:
    mov     r2, r1  @ r1 is higher
.Lrest:
    ...             @ rest of code

@ With conditionals; much cleaner
    cmp     r0, r1
    movge   r2, r0  @ r0 is higher
    movlt   r2, r1  @ r1 is higher
    ...             @ rest of code
```

另一个可选的项目是：是否设置状态标志。像 `cmp` 这样的测试指令总是设置它们，但大多数其他指令需要一个“-s”后缀。比如 `sub` 不会设置标志，但 `sub`**`s`** 会。因为这有点和复数“s”撞车，我给复数形式加个撇号来区分，所以 `subs` 表示带状态标志的 `sub`，而 `sub`'s 则表示多条 `sub` 指令。

:::tip 所有指令都是条件执行的

ARM 集的每条指令都可以带条件执行，从而得到更短、更干净、更快的代码。

:::

#### 桶形移位器

桶形移位器（barrel shifter）是一块专门执行位偏移的电路。嗯，是偏移和旋转（rotate），但这里我一概用“shift”这个词。桶形移位器是 ARM 核心的一部分，位于任何算术运算之前，因此它能极快地处理被偏移过的数字。桶形移位器的真正价值在于：几乎每条指令都能对它的某个操作数施加一次偏移，且不花额外代价。

桶形移位有四种操作：左移（`lsl`）、逻辑右移（`lsr`）、算术右移（`asr`）和循环右移（`ror`）。算术与逻辑右移的区别在于有符号/无符号数；详见[位操作小节](numbers.html#ssec-bitops-false)。这些操作附着在一次运算的最后一个寄存器上，后跟一个立即数或寄存器。比如，不只是简单的 `Rm`，你还可以写“`Rm, lsl #2`”表示 `Rm<<2`，以及“`Rm, lsr Rs`”表示 `Rm>>Rs`。因为偏移后的寄存器能用于几乎所有指令，而我又不想老是把全称写全，我会把偏移后的寄存器记作 *Op2*。

这现在看着可能像某种冷僻的功能，但它其实非常有用，而且比你想的更常见。一个应用是乘以 2<sup>n</sup>±1，无需动用相对较慢的乘法指令。比如，*x*\*9 等同于 *x*\*(1+8) = *x* + *x*\*8 = *x*+(*x*\<\<3)。这可以用一条 `add` 完成。另一个用途是从数组加载值，为此索引必须乘以元素大小才能算出正确的地址。

```armasm
@ Multiplication by shifted add/sub

add r0, r1, r1, lsl #3      @ r0= r1+(r1<<3) = r1*9
rsb r0, r1, r1, lsl #4      @ r0= (r1<<2)-r1 = r1*15

@ word-array lookup: r1= address (see next section)
ldr r0, [r1, r2, lsl #2]    @ u32 *r1; r0= r1[r2]
```

当然也可能有其他用途。和“条件执行”一样，你可能并不真的*需要*用到偏移后的 `add` 之类，但它们能让聪明的程序员写出一些*妙不可言*的优化代码。这些正是让汇编充满乐趣的东西。

:::tip 偏移是免费的！

或者至少近乎免费。按值偏移（shift-by-value）不花额外代价，而按寄存器偏移（shift-by-register）只花一个周期。实际上，位循环（bit-rotate）也是这样，但它们相当罕见，而且既然我不知道一个能同时涵盖两者的正确术语，我就一概用“shift”这个词了。

:::

#### 立即数的使用受限

现在轮到让 ARM 汇编变得不那么有趣的一点了。我说过，每条指令长 32 位。好了，有 16 个条件码，要占用指令里的 4 位。然后是两个 4 位的段给目的寄存器和第一操作数寄存器，一个给设置状态标志，还有数目不定的位留给其他事项，比如真正的 opcode。问题的底线是：留给任何你想用的立即数的，只剩 12 位了。

没错，12 位。**足足 12 位**。你可能已经意识到了，既然这只能表示 4096 个不同的值，这就有点成问题了。而你是对的。这是 RISC 处理器的一大坏消息：在把位分配给指令类型、寄存器和其他字段之后，留给真正数字的空间所剩无几。那么，要怎么加载像 `0601:0000`（对象 VRAM）这样的数字呢？嗯……你*做不到*！至少，不能一步到位。

所以，能直接使用的数字只有有限的一些；其余的必须用多个较小的数字拼凑出来。设计者没有简单地用那 12 位装一个整数，而是把它拆成了一个 8 位的数字（*n*）和一个 4 位的循环字段（*r*）。剩下的交给桶形移位器。完整的立即数值 *v* 由下式给出：

<table id="eq-imm">
  <tr>
    <td class="eqnrcell">(23.1)</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>v</mi>
                  <mo>=</mo>
                  <mi>n</mi>
                  <mtext>&#xA0;</mtext>
                  <mi>r</mi>
                  <mi>o</mi>
                  <mi>r</mi>
                  <mtext>&#xA0;</mtext>
                  <mn>2</mn>
                  <mo>&#x2217;</mo>
                  <mi>r</mi>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

这意味着你能构造出诸如 255（*n*=255，*r*=0）和 0x06000000（*n*=6，*r*=4（记住，是循环*右*移））这样的值。然而，511 和 0x06010000 仍然非法，因为它们的位模式塞不进一个字节。对于这些非法数字，你有两个选择：用多条指令拼出来，或者从内存加载。两者都可能相当昂贵，所以如果能避开，就避开。

构造更大数字的“更快”方法尚有争议。牵扯到的因素太多：你心里想的数字、内存段、指令集以及剩余空间，全都在以棘手的方式相互作用。或许最好的做法是别太操心，但作为准则，我会说：如果你能用两条数据指令搞定，就那么做；不行的话，就用一次加载。创建大数字最简单的方式，是使用 `ldr` 指令的一种特殊形式：“`ldr Rd,=num`”（注意：没有“#”！）。汇编器会在数字允许时把它变成一条 mov，不允许时变成一条 `ldr`。数字所需的空间也会自动被创建好。

```armasm
    @ form 511(0x101) with mov's
    mov     r0, #256    @ 256= 1 ror 24, so still valid
    add     r0, #255    @ 256+255 = 511

    @ Load 511 from memory with special ldr
    @ NOTE: no '#' !
    ldr     r0,=511
```

立即操作数只剩下“8 位的数 + 4 位的循环”可用，这是你必须学会与之共存的事。如果汇编器偶尔抱怨非法常量，你现在知道它是什么意思、以及该怎么修正了。哦，如果你觉得这已经够糟了，想想 Thumb 代码会怎样——它只有 16 位可用。

:::warning 唯一合法的立即数是被循环移位的字节

当指令允许立即数时，唯一被允许的值是那些能化简为一个字节、并以偶数位循环右移得到的数。0xFF 和 0x100 合法，但 0x101 不合法。这不仅影响数据操作，也影响内存寻址，因为你将无法一步加载一个完整的 32 位地址。你要么用较小的部分拼出更大的值，要么使用“加载-赋值”结构：“`ldr `_`Rd`_`,=`_`num`_”，汇编器会在可能时把它转换成 `mov`，不可能时转换成一次 PC 相对加载。

:::

:::tip 记住上一条提示

这值得单独成一条提示吗？也许不，但上一条提示重要到值得记住。代码以那种方式行事并不直观，而如果你曾对着那个神秘莫测的 [invalid constant](https://gbadev.net/forum-archive/thread/8/9602.html)（非法常量）错误信息发呆，没有这点信息你大概会彻底迷失。

:::

### 数据指令 {#ssec-arm-data-ins}

数据操作执行程序的计算，既包括算术也包括逻辑操作。你可以在 {@tbl:ins-data} 找到数据指令的汇总。虽然这里按四组列出，但唯一的真正划分在于乘法和其他指令之间。如你所见，**没有**除法指令。虽然这能被视为极度恼人，但事实证明对除法的需求其实相当小——小到足以把它从指令集里砍掉。

和某些处理器不同，ARM 只能对寄存器做数据处理，不能直接对内存变量。大多数数据指令用一个目的寄存器和两个操作数。第一操作数永远是个寄存器，第二操作数可以是四种东西之一：一个立即数或寄存器（ \#_n_ / `Rm`），或者一个被立即数或寄存器偏移过的寄存器（“`Rm, lsl #`_`n`_”、“`Rm, lsl Rs`”，以及 `lsr`、`asr`、`ror` 的类似形式）。因为这种安排相当常见，它常被简称为 *Op2*，即便它其实并非第二个操作数。

和所有指令一样，数据指令可以通过加上适当的后缀来条件执行。它们也能通过追加 -`s` 前缀来改变状态标志。两者同时使用时，条件后缀永远在前。

<div class="cblock">
  <table id="tbl:ins-data">
    <caption align="bottom">
      <b>{!@tbl:ins-data}</b>: Data processing instructions. Basic format <code>op{cond}{s} Rd, Rn, Op2</code>, <code>cond</code> and <code>s</code> are the optional condition and status codes, and <i>Op2</i> a shifted register.
    </caption>
    <tr>
      <td>
        <table class="table-data">
          <tr align="center"><th>opcode		<th>operands	<th> function</tr>
          <tr><th colspan=3 align="center">Arithmetic				</tr>
          <tr><td>adc		<td>Rd, Rn, Op2 <td>Rd = Rn + Op2 + C	</tr>
          <tr><td>add		<td>Rd, Rn, Op2 <td>Rd = Rn + Op2		</tr>
          <tr><td>rsb		<td>Rd, Rn, Op2 <td>Rd = Op2 - Rn		</tr>
          <tr><td>rsc		<td>Rd, Rn, Op2 <td>Rd = Op2 - Rn - !C	</tr>
          <tr><td>sbc		<td>Rd, Rn, Op2 <td>Rd = Rn - Op2 -!C	</tr>
          <tr><td>sub		<td>Rd, Rn, Op2 <td>Rd = Rn - Op2		</tr>
          <tr><th colspan=3 align="center">Logical ops				</tr>
          <tr><td>and		<td>Rd, Rn, Op2 <td>Rd = Rn &amp; Op2	</tr>
          <tr><td>bic		<td>Rd, Rn, Op2 <td>Rd = Rn &amp;~ Op2	</tr>
          <tr><td>eor		<td>Rd, Rn, Op2 <td>Rd = Rn ^ Op2		</tr>
          <tr><td>mov		<td>Rd, Op2		<td>Rd = Op2			</tr>
          <tr><td>mvn		<td>Rd, Op2		<td>Rd = ~Op2			</tr>
          <tr><td>orr		<td>Rd, Rn, Op2 <td>Rd = Rn | Op2	</tr>
        </table>
      </td>
      <td width=10%>&nbsp;</td>
      <td>
        <table class="table-data">
          <tr align="center"><th>opcode		<th>operands	<th> function
          <tr><th colspan=3 align="center">Status ops			</tr>
          <tr><td>cmp		<td>Rn, Op2		<td>Rn - Op2		</tr>
          <tr><td>cmn		<td>Rn, Op2		<td>Rn + Op2		</tr>
          <tr><td>teq		<td>Rn, Op2		<td>Rn &amp; Op2	</tr>
          <tr><td>tst		<td>Rn, Op2		<td>Rn ^ Op2		</tr>
          <tr><th colspan=3 align="center">Multiplies			</tr>
          <tr><td>mla		<td>Rd, Rm, Rs, Rn		<td>Rd = Rm * Rs + Rn	</tr>
          <tr><td>mul		<td>Rd, Rm, Rs			<td>Rd = Rm * Rs		</tr>
          <tr><td>smlal	<td>RdLo, RdHi, Rm, Rs	<td>RdHiLo += Rm * Rs	</tr>
          <tr><td>smull	<td>RdLo, RdHi, Rm, Rs	<td>RdHiLo = Rm * Rs	</tr>
          <tr><td>umlal	<td>RdLo, RdHi, Rm, Rs	<td>RdHiLo += Rm * Rs	</tr>
          <tr><td>umull	<td>RdLo, RdHi, Rm, Rs	<td>RdHiLo = Rm * Rs	</tr>
        </table>
      </td>
    </tr>
  </table>
</div>

第一组是算术，只含加法和减法的若干变体。`add` 和 `sub` 是它们的基形式。`rsb` 是个特殊的东西，反转了操作数顺序；和常规 `sub` 的区别在于，现在 *Op2* 是*被减数*（减去它的那个数）。只有 *Op2* 允许带立即数和偏移寄存器，这让你能取负数（0−*x*）以及用 2<sup>n</sup>−1 来快速相乘。

以“`c`”结尾的变体是带进位的加减法，使得超过寄存器大小的数值算术成为可能。比如，假设你有 8 位寄存器，想加 0x00FF 和 0x0104。因为后者装不进一个寄存器，你得拆分它然后加两次，从最低有效字节开始。得到 0xFF+0x04=0x103，用目的寄存器里的 0x02 以及被置位的进位标志来表示。第二部分里，你得把操作数的 0x00 和 0x01 *以及*低字节的进位相加，得到 0x00+0x01+1 = 0x02。现在把分开的部分串起来，得到 0x0203。

因为 ARM 寄存器有 32 位宽，你大概不会太常用到那些指令，但谁说得准呢。

第二组是位操作，大部分你应该已经熟悉。它们在 C 运算符里都有精确对应，位清除（bit-clear）除外。不过，这样一条指令的价值应该不言自明。你会注意到这里明显缺了移位指令，原因很简单：它们并非真正必要，多亏了桶形移位器，`mov` 指令就能用来做移位和循环旋转了。“r1 = r0\<\<4”可以写成“`mov r1, r0, lsl #4`”。

这点我已经提了好几遍，但既然我们现在在打交道的是另一门语言，值得再重复一遍：对有符号和无符号数右移，是有区别的。右移从顶部移除位；无符号数应该零扩展（用 0 填充），但有符号数应该符号扩展（用原有的 MSB 填充）。这就是<dfn>逻辑右移</dfn>（logical shift right）和<dfn>算术右移</dfn>（arithmetic shift right）的区别。这不适用于左移，因为左移无论如何都是填零。

第三组其实算不上什么组。状态标志操作根据各自功能的结果来设置状态位。现在，你用常规指令也能做这事；比如，比较（`cmp`）本质上就是一次也会设置状态标志的减法，也就是 `subs`。唯一真正的区别在于，这次没有寄存器来装载操作的结果。

最后是乘法格式。正如表格所示，你不能用立即数；如果想乘一个常量，你必须先把它加载进寄存器。其次，没有 *Op2* 就意味着没有偏移寄存器。还有第三条规则：Rd 和 Rm 不能用同一个寄存器，这是由乘法算法的实现方式决定的。话虽如此，用 Rd=Rm 似乎并没有什么不良影响。

指令 `mla` 意为“带累加的乘法”（multiply with accumulate），对点积之类很方便。`mull` 和 `mlal` 指令用于 64 位算术，当你预期结果装不进 32 位寄存器时很有用。

```armasm
@ Possible variations of data instructions
add     r0, r1, #1          @ r0 = r2 + 1
add     r0, r1, r2          @ r0 = r1 + r2
add     r0, r1, r2, lsl #4  @ r0 = r1 + r2<<4
add     r0, r1, r2, lsl r3  @ r0 = r1 + r2<<r3

@ op= variants
add     r0, r0, #2          @ r0 += 2;
add     r0, #2              @ r0 += 2; alternative  (but not on all assemblers)

@ Multiplication via shifted add/sub
add     r0, r1, r1, lsl #4  @ r0 = r1 + 16*r1 = 17*r1
rsb     r0, r1, r1, lsl #4  @ r0 = 16*r1 - r1 = 15*r1
rsb     r0, r1, #0          @ r0 =     0 - r1 = -r1

@ Difference between asr and lsr
mvn     r1, #0              @ r1 = ~0 = 0xFFFFFFFF = -1
mov     r0, r1, asr #16     @ r0 = -1>>16 = -1
mov     r0, r1, lsr #16     @ r0 = 0xFFFFFFFF>>16 = 0xFFFF = 65535


@ Signed division using shifts. r1= r0/16
@ if(r0<0)
@     r0 += 0x0F;
@  r1= r0>>4;
mov     r1, r0, asr #31         @ r0= (r0>=0 ? 0 : -1);
add     r0, r0, r1, lsr #28     @ += 0 or += (0xFFFFFFFF>>28 = 0xF)
mov     r1, r0, asr #4          @ r1 = r0>>4;
```

### 内存指令：加载与存储 {#ssec-arm-mem}

因为 ARM 处理器只能对寄存器做数据处理，与内存的交互就只有两种形式：把值从内存加载进寄存器，以及把值从寄存器存储到内存。

做这件事的基本指令是 `ldr`（LoaD Register）和 `str`（STore Register），它们加载和存储字（word）。同样，最通用的形式用到两个寄存器和一个 *Op2*：

<table>
  <tr>
    <td class="eqnrcell"></td>
    <td class="eqcell">
      <i>op</i>{cond}{type} Rd, [Rn, <i>Op2</i>]
    </td>
</table>

这里 *op* 是 `ldr` 或 `str`。因为它们外表如此相似，在接下来的语法讨论里我就只用 `ldr`，除非有不同之处。条件标志同样直接跟在基 opcode 后面。*type* 指要加载（或存储）的数据类型，可以是字、半字或字节。字形式不用任何扩展，半字用 `-h` 或 `-sh`，字节用 `-b` 和 `-sb`。多出来的 `s` 表示有符号的字节或半字。因为寄存器是 32 位的，高位需要根据期望的数据类型做符号扩展或零扩展。

这里的第一个寄存器 `Rd`，既可以是目的也可以是源寄存器。方括号之间的东西永远表示内存地址；`ldr` 表示从内存*加载*，此时 `Rd` 是目的；`str` 表示向内存*存储*，所以 `Rd` 在那里是源。`Rn` 被称为<dfn>基址寄存器</dfn>（base register），理由我们稍后说明，而 *Op2* 通常充当一个偏移量。这种组合运作起来非常像数组索引和指针算术。

:::note 内存操作 vs C 指针/数组

为了让和 C 的对比稍微容易些，我有时会使用指针来指示发生了什么，但为了做到这点，我得用某种方式表明指针的类型。我可以用某种可怕的强制类型转换记法，但用数组的形式会最方便，并用“寄存器名 + 后缀”来显示数据类型。我会用“\_w”表示字，“\_h”表示半字，“\_b”表示字节，以及“\_sw”等表示它们的有符号版本。比如 `r0_sh` 表示 `r0` 是一个有符号半字指针。这只是个有用的简写，并非汇编本身的一部分。

```armasm
@ Basic load/store examples. Assume r1 contains a word-aligned address
ldr     r0, [r1]    @ r0= *(u32*)r1; //or r0= r1_w[0];
str     r0, [r1]    @ *(u32*)r1= r0; //or r1_w[1]= r0;
```

:::

#### 寻址模式

交互的方式有若干种，被称为<dfn>寻址模式</dfn>（addressing modes）。最简单的形式是*直接寻址*（direct addressing），即你通过立即数直接给出地址。然而，ARM 系统没有这种模式，因为完整的地址塞不进指令里。我们真正拥有的是几种间接寻址形式。

第一种可用形式是<dfn>寄存器间接寻址</dfn>（register indirect addressing），即从寄存器获取地址，像“`ldr Rd, [Rn]`”。它的一个扩展是<dfn>前索引寻址</dfn>（pre-indexed addressing），它在加载前给基址寄存器加上一个偏移。其基本形式是“`ldr Rd, [Rn, `_`Op2`_`]`”。这非常像数组访问。比如“`ldr r1, [r0, r2, lsl #2]`”对应 `r0_w[r2]`：用 `r2` 作索引的字数组加载。

另一种特殊形式是<dfn>PC 相对寻址</dfn>（PC-relative addressing），它弥补了没有直接寻址的缺憾。假设你内存某处有个变量。虽然你可能没法直接使用那个变量的地址，但你能做的是把地址存放在离你代码所在处很近的地方。*那个*地址和程序计数器寄存器（PC）处在某个被允许的偏移范围内，所以你可以从那里加载变量的地址，再去读取变量的内容。你也可以用它来加载那些大到塞不进一个被偏移过的字节的常量。

虽然手动计算所需偏移是可能的，但你会很高兴知道可以让汇编器替你做这件事。有两种做法。第一种是创建一个<dfn>数据池</dfn>（data-pool），把你打算放地址和常量的地方放进去，并给它加个标签。然后你可以通过“`ldr Rd, `_`LabelName`_”（注意这里没有方括号）来获取它的地址。汇编器会把它变成 PC 相对的加载。第二种方法是用“`ldr Rd,=`_`foo`_”让汇编器包办一切，其中 *foo* 是变量名或一个立即数。汇编器会自行为 *foo* 分配空间。请记住，使用 *=varname* 并**不会**加载变量本身，只加载它的地址。

然后就是所谓的<dfn>写回</dfn>（write-back）模式了。在前索引模式里，最终地址由 `Rn`+*Op2* 构成，但那对 `Rn` 没有副作用。而在写回模式下，最终地址会被放进 `Rn`。这在遍历数组时很有用，因为你不需要真正的索引。

写回有两种形式：前索引和後索引。前索引写回和普通的写回很像，用方括号后的一个感叹号表示：“`ldr Rd, [Rn, `_`Op2`_`]!`”。后索引写回要等到内存访问*之后*才把 *Op2* 加到地址（和 `Rn`）上；它的格式是“`ldr Rd, [Rn], `_`Op2`_”。

```armasm
@ Examples of addressing modes
@ NOTE: *(u32*)(address+ofs) is the same as ((u32*)address)[ofs/4]
@   That's just how array/pointer offsets work
    mov     r1, #4
    mov     r2, #1
    adr     r0, fooData     @ u32 *src= fooData;
@ PC-relative and indirect addressing
    ldr     r3, fooData             @ r3= fooData[0];   // PC-relative
    ldr     r3, [r0]                @ r3= src[0];       // Indirect addressing
    ldr     r3, fooData+4           @ r3= fooData[1];   // PC-relative
    ldr     r3, [r0, r1]            @ r3= src[1];       // Pre-indexing
    ldr     r3, [r0, r2, lsl #2]    @ r3= src[1]        // Pre-index, via r2
@ Pre- and post-indexing write-back
    ldr     r3, [r0, #4]!           @ src++;    r3= *src;
    ldr     r3, [r0], #4            @ r3= *src; src++;
@ u32 fooData[3]= { 0xF000, 0xF001, 0xF002 };
fooData:
    .word   0x0000F000
    .word   0x0000F001
    .word   0x0000F002
```

:::tip PC 相对寻址特例

PC 相对指令很常见，而且有一个专门的简写，比创建一个数据池来加载更方便也更短。格式是“`ldr Rd,=`_`foo`_”，其中 *foo* 是一个标签或一个立即数。两种情况下，都会自动创建一个池来容纳这些数字。注意，标签对应的是它的*地址*，而非该地址的内容。

如果标签离得足够近，你也可以用 `adr`，它被汇编成一条 PC 加法指令。这不会创建一个池条目。

```armasm
@ Normal pc-relative method:
@   create a nearby pool and load from it
    ldr     r0, .Lpool      @ Load a value
    ldr     r0, .Lpool+4    @ Load far_var's address
    ldr     r0, [r0]        @ Load far_var's contents
.Lpool:
    .word   0x06010000
    .word   far_var
```

```armasm
@ Shorthand: use ldr= and GCC will manage the pool for you
    ldr     r0,=0x06010000  @ Load a value
    ldr     r0,=far_var     @ Load far_var's address
    ldr     r0, [r0]        @ Load far_var's contents
```

注意，我在这里其实并没有创建 `far_var`；只是为它的地址留了存储空间。变量的创建留到后面讲。

:::

#### 数据类型

也可以加载/存储字节和半字。加载的 opcode 是 `ldrb` 和 `ldrh`（无符号），以及 `ldrsb` 和 `ldrsh`（有符号字节和半字）。有符号版本里的“r”其实可选，所以你偶尔也会看到 `ldsb` 和 `ldsh`。因为存储时能顺手把较高位的字节强制转换掉，`strb` 和 `strh` 对有无符号的存储都适用。

所有你用 `ldr/str` 能做的事，用字节和半字版本也都能做：PC 相对、间接、前/后索引，一样不缺……只有一个例外。有符号字节加载（`ldsb`）和*所有*的半字加载与存储，都不能做偏移寄存器加载。只有 `ldrb` 拥有字指令的完整功能。后果就是，有符号字节或半字数组可能需要额外的指令来照看偏移和索引。

哦，还有一件事：对齐。在 C 里，你可以依赖编译器把变量对齐到它们偏好的边界。现在你从编译器手里接管了这事，理所当然你也就得负责对齐了。这可以通过“.align _n_”伪指令完成，它把下一段代码或数据对齐到 2<sup>n</sup> 边界。实际上，代码你也该恰当地对齐，在这个片段里我把它当作理所当然，因为那能让事情简单些。

<pre><code class="language-armasm hljs">    mov     r2, #1
@ Byte loads
    adr     r0, bytes
    ldrb    r3, bytes       @ r3= bytes[0];     // r3= 0x000000FF= 255
    ldrsb   r3, bytes       @ r3= (s8)bytes[0]; // r3= 0xFFFFFFFF= -1
    ldrb    r3, [r0], r2    @ r3= *r0_b++;      // r3= 255, r0++;
@ Halfword loads
    adr     r0, hwords
    ldrh    r3, hwords+2    @ r3= words[1];     // r3= 0x0000FFFF= 65535
    ldrsh   r3, [r0, #2]    @ r3= (s16)r0_h[1]; // r3= 0xFFFFFFFF= -1
    <span class="rem">ldrh    r3, [r0, r2, lsl #1]    @ r3= r0_h[1]? <b>No! Illegal instruction :(</b></span>

@ Byte array: u8 bytes[3]= { 0xFF, 1, 2 };
bytes:
    .byte   0xFF, 1, 2
@ Halfword array u16 hwords[3]= { 0xF001, 0xFFFF, 0xF112 };
    .align  1    @ align to even bytes <b>REQUIRED!!!</b>
hwords:
    .hword  0xF110, 0xFFFF, 0xF112
</code></pre>

#### 块传输

块传输允许你用一条指令把多个连续字加载或存储进寄存器。这很有用，因为它省指令，但更重要的是省时间——因为单独的内存指令相当昂贵，而用块传输你只需付一次开销。块传输的基本指令是 `ldm`（LoaD Multiple）和 `stm`（STore Multiple），操作数是一个基址寄存器（可选带一个给 `Rd` 写回的感叹号）以及一对花括号里的寄存器列表。

<table>
  <tr>
    <td class="eqnrcell"></td>
    <td class="eqcell">
      <i>op</i>{cond}{mode} Rd{!}, {<i>Rlist</i>}
    </td>
</table>

这个寄存器列表可以用逗号分隔，也可以用连字符表示一个范围。比如 `{r4-r7, lr}` 表示寄存器 r4、r5、r6、r7 和 r14。寄存器实际被加载或存储的顺序，**并非**依据它们在这个列表里被指定的顺序！相反，列表指示的是所用字的数量（本例为 5），而地址的顺序跟随寄存器的索引：最低寄存器用块里的最低地址，依此类推。

块传输的 opcode 可以带若干后缀，决定块如何相对于基址寄存器 `Rd` 延伸。四种可能是：`-IA`/`-IB`（增量後/增量前，Increment After/Before）和 `-DA`/`-DB`（减量後/减量前，Decrement After/Before）。区别本质上就在于前/后索引，以及从基地址递增还是递减。应当指出，这些递增/递减的发生与否，和基址寄存器是否带感叹号无关：那个东西只表示基址寄存器*本身*是否随后被更新。

```armasm
    adr     r0, words+16    @ u32 *src= &words[4];
                            @             r4, r5, r6, r7
    ldmia   r0, {r4-r7}     @ *src++    :  0,  1,  2,  3
    ldmib   r0, {r4-r7}     @ *++src    :  1,  2,  3,  4
    ldmda   r0, {r4-r7}     @ *src--    : -3, -2, -1,  0
    ldmdb   r0, {r4-r7}     @ *--src    : -4, -3, -2, -1
    .align  2
words:
    .word   -4, -3, -2, -1
    .word    0,  1,  2,  3, 4
```

块传输也用于栈操作。栈有四种类型，取决于 `sp` 指向的地址是否已经有一个被堆叠的值（满栈 Full 或空栈 Empty），以及栈在内存中是向下还是向上生长（递减 Descending/递增 Ascending）。它们有专用的后缀（`-FD`、`-FA`、`-ED` 和 `-EA`），因为用标准后缀会别扭。比如，GBA 使用 FD 型栈，这意味着压栈用 `stmdb`（因为存储后递减会覆盖一个已经被堆叠的值（满栈）），而弹栈出于类似原因需要 `ldmia`。一对 `stmfd/ldmfd` 处理起来要轻松得多。或者你也可以直接用 `push` 和 `pop`，它们分别展开为“`stmfd sp!,`”和“`ldmfd sp!,`”。

<div class="lblock">
  <table id="tbl:block" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:block}</b>: Block transfer instructions.
    </caption>
    <tr>
      <th>Block op</th>
      <th>Standard</th>
      <th>Stack alt</th>
    </tr>
    <tr>
      <td>Increment After</td>
      <td>ldmia / stmia</td>
      <td>ldmfd / stmea</td>
    </tr>
    <tr>
      <td>Increment Before</td>
      <td>ldmib / stmib</td>
      <td>ldmed / stmfa</td>
    </tr>
    <tr>
      <td>Decrement After</td>
      <td>ldmda / stmda</td>
      <td>ldmfa / stmed</td>
    </tr>
    <tr>
      <td>Decrement Before</td>
      <td>ldmdb / stmdb</td>
      <td>ldmea / stmfd</td>
    </tr>
  </table>
</div>

:::warning push 和 pop 并非通用的 ARM 指令

它们似乎在 devkitARM r15 及更高版本上能用（更老的版本我没查过），但比如 DevKitAdv 就不接受它们。试试看会发生什么就知道了。

:::

### 条件与分支 {#ssec-arm-cnd}

高级语言通常有大量方法来实现选择、循环和函数调用。但它们归根结底都指向同一件事：能够移动程序计数器，从而改变程序的流向。这个过程被称为分支。

ARM 里有三种分支指令：用于 if 和循环的简单分支 `b`，用于函数调用的带链接分支 `bl`，以及用于 ARM 和 Thumb 代码间切换、从函数返回和跨段跳转的带交换分支 `bx`。`b` 和 `bl` 用标签作参数，但 `bx` 用一个装有目标地址的寄存器。技术上还有更多分支方式（PC 毕竟只是另一个寄存器），但这三种是主要的。

#### 状态标志与条件码

这点我在引言里已经提过一部分，所以我就长话短说。ARM 处理器有 4 个状态标志：（**Z**）ero 零、（**N**）egative 负、（**C**）arry 进位和符号溢（**V**）erflow 溢出，它们能在程序状态寄存器里找到。其实有两个：一个管*当前*状态（CPSR），一个*被保存的*状态寄存器（SPSR），用在中断处理程序里。不过你都不必去管它们，因为对状态寄存器的响应通常经由条件码进行（表 23.4）。但首先，几句关于标志本身的话：

- **零**（Z）。如果操作的结果为 0。
- **负**（N）。结果为负（即最高有效位被置位）。
- **进位标志置位**（C）。如果“最最”重要的位被置位（比如 32 位操作中的第 32 位）。
- **算术溢出**（V）。比如两个正数相加却得到一个负数，因为结果太大，寄存器装不下。

每条数据指令都可以通过追加 `-s` 来设置状态标志，但 `cmp`、`cmn`、`tst` 和 `teq` 除外，它们总是设置标志。

{\*@tbl:cnd-afx} 列出了可以加到基本分支指令上的 16 个后缀。比如 `bne Label` 会在状态非零时跳到 `Label`，否则继续执行下一条指令。

<div class="lblock">
  <table id="tbl:cnd-afx" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:cnd-afx}</b>: conditional affixes.
    </caption>
    <col span=2 align="center">
      <tr>
        <th>Affix</th>
        <th>Flags</th>
        <th>Description</th>
      </tr>
      <tr>
        <td>eq</td>
        <td>Z=1</td>
        <td>Zero (EQual to 0)</td>
      </tr>
      <tr>
        <td>ne</td>
        <td>Z=0</td>
        <td>Not zero  (Not Equal to 0)</td>
      </tr>
      <tr>
        <td>cs / hs</td>
        <td>C=1</td>
        <td>Carry Set / unsigned Higher or Same </td>
      </tr>
      <tr>
        <td>cc / lo</td>
        <td>C=0</td>
        <td>Carry Clear / unsigned LOwer</td>
      </tr>
      <tr>
        <td>mi</td>
        <td>N=1</td>
        <td>Negative (MInus)</td>
      </tr>
      <tr>
        <td>pl</td>
        <td>N=0</td>
        <td>Positive or zero (PLus)</td>
      </tr>
      <tr>
        <td>vs</td>
        <td>V=1</td>
        <td>Sign overflow (oVerflow Set)</td>
      </tr>
      <tr>
        <td>vc</td>
        <td>V=0</td>
        <td>No sign overflow (oVerflow Clear)</td>
      </tr>
      <tr>
        <td>hi</td>
        <td>C=1 &amp; Z=0</td>
        <td>Unsigned HIgher</td>
      </tr>
      <tr>
        <td>ls</td>
        <td>C=0 | Z=1</td>
        <td>Unsigned Lower or Same</td>
      </tr>
      <tr>
        <td>ge</td>
        <td>N=V</td>
        <td>Signed Greater or Equal</td>
      </tr>
      <tr>
        <td>lt</td>
        <td>N != V</td>
        <td>Signed Less Than</td>
      </tr>
      <tr>
        <td>gt</td>
        <td>Z=0 &amp; N=V</td>
        <td>Signed Greater Than</td>
      </tr>
      <tr>
        <td>le</td>
        <td>Z=1 | N != V</td>
        <td>Signed Less or Equal</td>
      </tr>
      <tr>
        <td>al</td>
        <td> - </td>
        <td>ALways (default)</td>
      </tr>
      <tr>
        <td>nv</td>
        <td> - </td>
        <td>NeVer</td>
      </tr>
    </col>
  </table>
</div>

要恰当地使用这些条件码，你既需要知道每个代表什么，也得知道数据操作是如何设置标志的。标志受指令本身影响，并非所有标志都被所有指令触及。比如，溢出只对算术有意义，对位操作则不然。

就 Z 和 N 而言，情况相当简单。操作给出一个特定的 32 位结果；如果是 0，则零标志被置位。因为用的是补码，负标志和位 31 相同。之所以 `-eq` 和 `ne` 和零标志挂钩，是因为比较（`cmp`）本质上就是一次减法：它看两个数之差，当差为零时，两数相等。

进位标志可能稍难一点。理解它最好的方式是把它当作一个额外的最高有效位。你可以在 {@tbl:carry} 的例子中看到它如何运作。这里我们把两个无符号数、2<sup>31</sup> = 0x80000000 相加。相加时，结果会溢出 32 位，得到 0 而非 2<sup>32</sup>。然而，那个溢出的位会进入进位。有了 `adc` 指令，你就能继续为比寄存器更大的数搭建加法器。

<style>
   #tbl\:carry, #tbl\:overflow {
    border: none;

    & table {
      width: 100%;
      font-size: 90%;
      border: none;
    }

    & span.rarr {
      font-size:200%;
      position: relative;
      top: 25px;
    }

    & td {
      padding: 3px 0;
    }

    & tr td, tr th {
      background-color: var(--bg);
      border: none;
      text-align: center;
    }

    & code {
      background-color: var(--bg);
      color: var(--fg)
    }

    & .bdrT, .bdrTL, .bdrTR, .bdrLL, .bdrRR {
      border-top: 1px var(--fg) solid;
    }

    & .bdrL, .bdrTL, .bdrBL, .bdrLL {
      border-left: 1px var(--fg) solid;
    }
    & .bdrB, .bdrBL, .bdrBR, .bdrLL, .bdrRR {
      border-bottom: 1px var(--fg) solid;
    }

    & .bdrR, .bdrTR, .bdrBR, .bdrRR {
      border-right: 1px var(--fg) solid;
    }
  }
</style>

<div class="lblock">
  <table id="tbl:carry">
    <caption align="bottom">
    <b>{*@tbl:carry}</b>: carry bit in (unsigned) addition.
    </caption>
    <col width=200>
      <tr valign="bottom">
        <td>
          <table class="eqtbl" cellpadding=2 cellspacing=0>
            <tr>
              <th>2<sup>31</sup> &nbsp;</th>
              <td><code>&nbsp;&nbsp;8000 0000</code></td>
            </tr>
            <tr>
              <th class="bdrB">2<sup>31</sup> &nbsp;</th>
              <td class="bdrB"><code>&nbsp;&nbsp;8000 0000</code></td>
              <td class="bdrB"> +</td>
            </tr>
            <tr>
              <th>2<sup>32</sup></th>
              <td><code><b>1</b> 0000 0000</code></td>
            </tr>
          </table>
        </td>
      </tr>
    </col>
  </table>
</div>

像 `orr` 或 `and` 这样的位操作不影响它，因为它们纯粹在较低的 32 位上运作。然而移位会影响。

你可能会觉得奇怪，为什么 `-cc` 是无符号“大于”的代码。如前所述，比较本质上是一次减法，但当你做减法，比如 7−1，这里似乎并没有什么进位。关键在于，减法其实是加法的形式：7−1 实际是 7+0xFFFFFFFF，它会溢出进进位位。你也可以把减法想成是从进位位被置位的状态开始。

溢出标志表示*有符号*溢出（进位位则是无符号溢出）。注意，这*不*单单是符号改变，而是朝错误方向的符号改变。比如，两个正数相加*理应*永远为正，但如果数字足够大（比如 2<sup>30</sup>，见 {@tbl:overflow}），那么较低 30 位的结果可能会溢出进位到位 31，从而改变符号，得到一个不正确的加法。对减法也有类似的问题。除了做完整运算并检查符号是否正确之外，没有简单的方法能判定什么算溢出，但幸好你不必亲自判断。通常溢出只对*有符号*比较重要，而条件助记符本身就应该给你足够信息去选对那一个。

<div class="lblock">
  <table id="tbl:overflow">
    <caption align="bottom">
      <b>{*@tbl:overflow}</b>: sign overflow.
    </caption>
    <col width=200>
      <tr valign="bottom">
        <td>
          <table class="eqtbl" cellpadding=2 cellspacing=0>
            <tr>
	            <th>+2<sup>30</sup> &nbsp;</th>
	            <td><code>4000 0000</code></td>
            </tr>
            <tr>

	            <th class="bdrB">+2<sup>30</sup> &nbsp;</th>
	            <td class="bdrB"><code>4000 0000</code></td>
	            <td class="bdrB"> +</td>
            </tr>
            <tr>
	            <th><b>&minus;</b>2<sup>31</sup></th>
	            <td><code>8000 0000</code>
            </tr>
          </table>
        </td>
      </tr>
    </col>
  </table>
</div>

牢记这些要点，条件码应该就不难理解了。描述告诉你在什么时候该用哪个代码。另外，别忘了任何指令都能带条件执行，不只有分支。

#### 基本分支

我们从最基本的分支 `b` 开始。这是最常用到的分支，用于实现普通的条件代码和各种循环。它最常和 {@tbl:cnd-afx} 的 16 个条件码之一搭配使用。大多数时候，一个分支看起来像这样：

```armasm
@ Branch example, pseudo code
    data-ops, Rd, Rn, Op2   @ Data operation to set the flags
    bcnd-code .Llabel       @ Branch upon certain conditions

    @ more code A

.Llabel:                    @ Branch goes here
    @ more code B
```

首先，你有一条设置状态标志的数据处理指令，通常是 `subs` 或 `cmp`，但也可以是它们中的任意一个。然后一个 `b`_cond_ 在条件满足时把流向引向 `.Llabel`。这个的一个简单例子是：一个除法例程先检查分母是否为零。比如，使用了 [BIOS Call](bios.html) #6 的 `Div()` 例程，可以这样防备被 0 除：

```armasm
@ int DivSafe(int num, int den);
@ \param num    Numerator (in r0)
@ \param den    Denominator (in r1)
@ \return       r0= r0/r1, or INT_MAX/INT_MIN if r1 == 0
DivSafe:
    cmp     r1, #0
    beq     .Ldiv_bad   @ Branch on r1 == 0
    swi     0x060000
    bx      lr
.Ldiv_bad:
    mvn     r1, #0x80000000     @ \
    sub     r0, r1, r0, asr #31 @ - r0= r0>=0 ? INT_MAX : INT_MIN;
    bx      lr
```

分子和分母分别在寄存器 r0 和 r1 里。`cmp` 检查分母是否为零。如果不是，就不分支，`swi` 6 被执行，函数随后返回。如果是零，`beq` 会把代码带到 `.Ldiv_bad`。那两条指令把 r0 设为 INT_MAX（2<sup>31</sup>−1 = 0x7FFFFFFF）或 INT_MIN（−2<sup>31</sup> = 0x80000000），取决于 r0 是正还是负。如果这点有点难看清，`mvn` 会反转位，所以 `.Ldiv_bad` 后的第一行把 r0 设为 INT_MAX。第二行我们之前见过：“`r0, asr #31`”做一个符号扩展到所有其他位，对正数和负数分别给出 0 或 −1，从而对 r0 的负值给出 INT_MAX− −1 = INT_MIN。像这样小小的优化技巧，决定了你是否有资格当一个汇编程序员；如果不行，你倒不如让编译器去做，因为它确实懂。（我那招“`asr #31`”最初就是从它那儿学来的。）

现在这个例子里我用了分支，但其实根本没必要。非分支部分只有一条指令，分支部分有两条，所以全程用条件指令本会既更短又快：

```armasm
@ Second version using conditionally executed code
DivSafe:
    cmp     r1, #0
    mvneq   r1, #0x80000000
    subeq   r0, r1, r0, asr #31
    swine   0x060000
    bx      lr
```

如果分母不是零，`mvneq` 和 `subeq` 实质被跳过。其实不算跳过，而是变成了 `nop`：空操作。所以 `swine`（即 `swi` + `ne`，这里没有小猪）在为零时也是如此。确实，除法那行多花了一个周期，但不走分支让那行例外稍稍快了点，而且函数本身从 7 条指令缩减到了 5 条。

:::tip 符号标签 vs 内部标签

在第一个 `DivSafe` 片段里，内部分支目标用了 `.L` 前缀，而函数标签没有。GCC 用 `.L` 前缀来指示“为了标签而存在的标签”，以区别于像 `DivSafe` 这样的符号标签。虽然非必需，但这是个有用的约定。

:::

#### 主分支与次分支

任何一种分支都会在路上分叉，而根据条件，某条路会被更频繁地走。那条就是<dfn>主分支</dfn>（major）。另一条则是<dfn>次分支</dfn>（minor），大概是某种异常。分支指令 `b` 代表对正常道路的偏离，而且相对昂贵，因此把分支留给异常是划算的。考虑这些可能性：

```c
// Basic if statement in C
if(r0 == 0)
{   /* IF clause */   }
...
```

```armasm
@ === asm-if v1 : 'bus stop' branch ===
    cmp     r0, #0
    beq     .Lif
.Lrest:
    ...
    bx      lr      @ function ends
.Lif
    @ IF clause
    b   .Lrest

@ === asm-if v2 : 'skip' branch ===
    cmp     r0, #0
    bne     .Lrest
    @ IF clause
.Lrest:
    ...
    bx      lr      @ function ends
```

第一个版本更像 C 版本：它为 IF 子句分出一支，然后回到代码其余部分。如果条件满足，流程会分支两次，但如果不满足，其余代码根本不分支。第二个版本在条件*不*满足时分支：它跳过了 IF 子句。总体而言，汇编代码更简单也更短，但分支条件和 C 版本相反这点，可能需要点时间去适应。

那么用哪个？嗯，其实看情况。在一切平等时，第二个更好，因为它少一条指令和一个标签。据我所知，这就是 GCC 用的。问题是，有些东西可能比别人更“平等”。如果 IF 子句是例外（即次分支），那就意味着第二个版本几乎总是走分支，而第一个版本几乎从不分支，所以平均而言后者会更快。

选哪个完全取决于你，毕竟你最清楚自己的意图。我希望如此。在本章剩余部分，我会用“跳过”分支（skip-branch），因为演示中情况通常都是平等的。当然，如果子句足够小，你也可以直接用条件指令了事 <kbd>:)</kbd>。

#### 常见分支结构

即便你现在只有 `b`，也不意味着你不能在汇编里实现高级语言中的分支结构。毕竟，编译器似乎办得到。这里有几个例子。

##### if-elseif

`if-elseif` 是普通 `if-else` 的扩展，从它你可以延伸到更长的 `if-elseif-else` 链。这里我想看一个把数字限制在特定边界内的环绕（wrapping）算法：数字 *x* 应该留在区间 \[_mn_, _mx_⟩ 内，如果它越过任一边界，就从另一端出来。在 C 里它长这样：

```c
// wrap(int x, int mn, int mx), C version:
int res;
if(x >= mx)
    res= mn + x-mx;
else if(x < mn)
    res= mx + x-mn;
else
    res= x;
```

直白的编译结果会是：

```armasm
@ r0= x ; r1= mn ; r2= mx
    cmp     r0, r2
    blt     .Lx_lt_mx       @ if( x >= mx )
    add     r3, r0, r1      @   r0= mn + x-mx
    sub     r0, r3, r2
    b       .Lend
.Lx_lt_mx:
    cmp     r0, r1          @
    bge     .Lend           @ if( x < mn )
    add     r3, r0, r2      @   r0= mx + x-mn;
    sub     r0, r3, r1
.Lend:
    ...
```

这是 GCC 给出的，而且相当好。子句的顺序得到了保留，这意味着分支的条件必须取反，于是“`if(x >= mx) {}`”变成了“如果不*是* _x_ \>= _mx_ 就跳过”。在每个子句末尾，你得跳过其他所有子句：分支到 `.Lend`。条件分支意为“去往下一个分支”。

现在来看一个优化版本。首先，`cmp` 等价于 `sub`，只是它不把结果放进寄存器。然而，既然我们稍后本就需要那个结果，我们不妨把“`cmp`”和“`sub`”合并。其次，子句相当小，所以我们也可以用条件操作。新版本会是：

```armasm
@ Optimized wrapper
    subs    r3, r0, r2      @ r3= x-mx
    addge   r0, r3, r1      @   x= x-mx + mn
    bge     .Lend
    subs    r3, r0, r1      @ r3= x-mn
    addlt   r0, r3, r2      @   r0= x-mn + mx;
.Lend:
    ...
```

干净多了，你说呢？更少的分支、更少的代码，而且和 C 代码贴得更紧。我们甚至能把最后一个分支也去掉，因为我们也能条件地执行那个 `subs`。因为 `ge` 和 `lt` 互为补集，不会互相干扰。所以最终版本是：

```armasm
@ Optimized wrapper, version 2
    subs    r3, r0, r2      @ r3= x-mx
    addge   r0, r3, r1      @   x= x-mx + mn
    sublts  r3, r0, r1      @ r3= x-mn
    addlt   r0, r3, r2      @   r0= x-mn + mx;
    ...
```

当然，并不总是能优化到这种程度。不过，如果子句本体很小，条件指令可能会变得很有吸引力。另外，把一次比较转换成某种你稍后本就需要的数据操作，是常见且推荐的做法。

##### 复合逻辑表达式

高级语言常常允许你用逻辑与（`&&`）和逻辑或（`||`）把多个条件串起来。书本往往不会说的是，这些无非是一串 `if` 的简写记法。实际发生的是这样：

```c
// === if(x && y) { /* clause */ } ===
if(x)
{
    if(y)
    { /* clause */ }
}

// === if(x || y) { /* clause */ } ===
if(x)
{ /* clause */ }
else if(y)
{ /* clause */ }
```

AND 里靠后的项，只有当前面的表达式为真时才会被求值。否则，它们就直接被跳过。如果第二项恰好是一个有副作用的函数，那就好玩了。逻辑 OR 本质上是一个带有相同子句的 if-else 链；这当然只是做做样子，在最终版本里只有一个子句被分支到。在汇编里，它们大概长这样：

```armasm
@ if(r0 != 0 && r1 != 0) { /* clause */ }
    cmp     r0, #0
    beq     .Lrest
    cmp     r1, #0
    beq     .Lrest
    @ clause
.Lrest:
    ...

@ Alternative
    cmp     r0, #0
    cmpne   r1, #0
    beq     .Lrest
    @ clause
.Lrest:
    ...
```

```armasm
@ if( r0 != 0 || r1 != 0 ){ /* clause */ }
    cmp     r0, #0
    bne     .Ltrue
    cmp     r1, #0
    beq     .Lrest
.Ltrue:
    @ clause
.Lrest:
    ...
```

一如往常，针对你的具体情况，总会出现替代方案。另外注意，你可以利用[德摩根定律](https://en.wikipedia.org/wiki/De_Morgan%27s_laws)把 AND 转换成 OR。

##### 循环

用汇编最重要的理由之一，是加快频繁使用的代码，而这多半会涉及循环，因为大部分时间都花在那上面。如果你能在非循环的情形里去掉一条指令，你就赢了一个周期。如果你从循环里去掉一条，那对循环的每一次迭代你都省了一个周期。比如，在清屏函数里省一个周期，就能省下 240\*160 = 19200 个周期——实际上更多，因为还有内存等待状态。那一个周期，可能就决定了动画是流畅还是卡顿。

简而言之，优化几乎全关乎循环，尤其是内层循环。有趣的是，这正是 GCC 常常失手的地方，因为它加了比必要更多的东西。比如，在较老的版本里（DKA 和 DKP r12，大概那样），它常常把构造出来的内存地址（VRAM 等）留在循环内部。不幸的是，DKP r19 在结构体拷贝和 `ldm/stm` 对上也有严重问题，它们现在相比其他方法只带来微小收益。现在，在你怪罪 GCC 让循环变慢之前，往往也是 C 程序员强迫 GCC 产生慢代码。在引言里，你能看到内联带来的巨大差异；而在[性能分析](text.html#ssec-demo-se2)演示里，我展示了用错数据类型会造成多大差别。

总之，汇编里的循环。造一个循环是世界上最简单的事：只要分支到一个前面的标签就行。`for`、`do-while` 和 `while` 循环的区别，在于你在哪里递增和测试。在 C 里，你通常用带递增索引的 for 循环。在汇编里，习惯上用带递减索引的 while 循环。这里是两个复制 16 个字的循环例子，应该能向你说明原因：

```armasm
@ Asm equivalents of copying 16 words.
@ u32 *dst=..., *src= ..., ii    // r0, r1, r2

@ --- Incrementing for-loop ---
@ for(ii=0; ii<16; ii++)
@     dst[ii]= src[ii];
    mov     r2, #0
.LabelF:
    ldr     r3, [r1, r2, lsl #2]
    str     r3, [r0, r2, lsl #2]
    add     r2, r2, #1
    cmp     r2, #16
    blt .LabelF

@ --- Decrementing while-loop ---
@ ii= 16;
@ while(ii--)
@     *dst++ = *src++;
    mov     r2, #16
.LabelW:
    ldr     r3, [r1], #4
    str     r3, [r0], #4
    subs    r2, r2, #1
    bne .LabelW
```

在递增的 for 循环里，你得先递增再和上限比较。在递减的 while 循环里，你做减法并测试是否为零。因为零测试已经是每条指令自带的一部分，你无需单独比较。没错，它快不了太多，大概 10% 左右，但这里省一点那里省一点，累积起来很可观。这种循环其实有很多版本，这里是另一个用块传输的。它们的好处是也能在 Thumb 里用：

```armasm
@ Yet another version, using ldm/stm

    add     r2, r0, #16
.LabelW:
    ldmia   r1!, {r3}
    stmia   r0!, {r3}
    cmp     r2, r0
    bne .LabelW
```

这是那种“懂点汇编能帮你写出高效 C”的情形之一。用递减计数器和指针算术通常能稍快一点，但通常 GCC 反正会替你做掉。另一点是用对数据类型。而“对”指的就是 `int`，当然。非 int 类型在每次算术运算后都需要隐式转换（`lsl`/`lsr` 对）。那是每次加、减或其他操作后的两条额外指令。虽然 GCC 已经相当擅长在可能时把非 int 转成 int，但过去并非总是如此，而且有时根本不可能。我亲眼见过上面的循环因为索引和指针是 `u16`，成本高出 600% 还多，不骗你。

处理循环时，要极其小心循环如何开始和停止。很容易写出一个多跑一次或少跑一次的循环。我相当确定这两个版本是正确的。我通常的检验方法是看计数为 1 或 2 时它怎么跑。如果那能通过，更大的数也一样。

:::tip 把比较和数据指令合并

**Z** 状态标志是围绕数字零转的，所以如果你用 0 来比较，常常能把比较和设置标志的数据指令合并。

测试单个位时也一样。**N** 和 **C** 标志实际上就是第 31 和 32 位。如果你能操纵算法去用它们，就不需要 `cmp` 或 `tst`。

:::

:::warning “不，还有另一个”

你可能已经知道这个，但这是个重复警告的好时机：当心差一错误（off-by-one errors，也称 [obi-wan errors](http://www.catb.org/~esr/jargon/html/O/obi-wan-error.html)）。少一次或多一次迭代实在太容易了，所以务必检查你手上的代码是否做了正确的事。对其他编程语言也一样，当然。

:::

#### 函数调用

函数调用用一种特殊的分支指令，即 `bl`。它的工作和普通分支一模一样，只是它会把 `bl` 之后的地址存进链接寄存器（`r14` 或 `lr`），这样你就知道被调用函数结束后该回到哪里。原则上，你可以用“`mov pc, lr`”返回函数，它把程序计数器指回调用函数，但在实践中你可能更想用 `bx`（Branch and eXchange，分支并交换）。区别在于 `bx` 还能在 ARM 和 Thumb 状态间切换，这是 `mov` 返回做不到的。和 `b`、`bl` 不同，`bx` 用一个寄存器作参数，而不是标签。这个寄存器通常是 `lr`，但其他的也允许。

还有向函数传参和从中返回值的问题。原则上你随便用哪套系统都行，但建议采用 ARM 自家的 [ARM 架构过程调用标准](https://github.com/ARM-software/abi-aa/releases/download/2023Q3/aapcs32.pdf)（AAPCS）。对大部分工作而言，可以概括如下：

- 前 4 个参数进 r0-r3。更后面的进栈，按出现顺序。
- 返回值进 r0。
- 暂存寄存器 r0-r3（和 r12）在函数里可以自由无限制地使用。因此，在*调用*一个函数之后，它们应被视为“脏”的。
- 其他寄存器必须以进入函数时相同的值离开函数。使用前把它们压栈，离开函数时弹出。注意，另一次 `bl` 会设置 `lr`，所以那种情况下也得把那个压栈。

下面是一个真实世界里的函数调用例子，包含完整的参数传递、栈操作和从调用返回。`oamcpy()` 函数拷贝 OBJ_ATTR。它使用和 `memcpy()` 相同的参数顺序，这些需要由调用函数设定；调用前后，`lr` 被压栈和弹出。这两件事属于所谓的“函数开销”的一部分，对小程序可能是灾难性的，我们之前已经见过。在 `oamcpy()` 内部，如果计数为 0 我们立即跳回，否则继续拷贝然后返回。注意这里 `r4` 被压栈了，因为那是调用者所期望的；如果我没有压、而调用者也用了 `r4`，那我就完蛋了，而且活该。我大概该指出，`r12` 通常也被视为暂存寄存器，这里我本可以用它代替 `r4`，从而免去压栈的必要。

```armasm
@ Function calling example: oamcpy
@ void oamcpy(OBJ_ATTR *dst, const OBJ_ATTR *src, u32 nn);
@ Parameters: r0= dst; r1= src; r2= nn;
    .align  2
oamcpy:
    cmp     r2, #0
    bxeq    lr          @ Nothing to do: return early
    push    {r4}        @ Put r4 on stack
.Lcpyloop:
        ldmia   r1!, {r3, r4}
        stmia   r0!, {r3, r4}
        subs    r2, #1
        bne     .Lcpyloop
    pop     {r4}        @ Restore r4 to its original value
    bx      lr          @ Return to calling function

@ Using oamcpy.
    @ Set arguments
    mov     r0, #0x07000000
    ldr     r1,=obj_buffer
    mov     r2, #128
    push    {lr}        @ Save lr
    bl      oamcpy      @ Call oamcpy (clobbers lr; assumes clobbering of r0-r3,r12)
    pop     {lr}        @ Restore lr
```

:::tip 用 bx 而非 mov pc,lr

`bx` 指令正是 ARM 和 Thumb 函数间互操作（interworking）得以实现的原因。互操作是好事。因此，`bx` 是好事。

:::

ARM 汇编的主要部分到此结束。还有更多东西，比如不同的处理器状态，以及数据交换（`swp`）和协处理器指令，但那些很少见。如果你需要更多信息，去合适的参考指南里查。接下来的两个小节讲指令速度和一条指令在二进制里到底长什么样，即处理器实际处理的东西。严格来说这两节都不是必需的，但仍有信息量。如果你不想被科普，就跳到下一节：[Thumb 指令集](asm.html#sec-thumb)。

### 周期计数 {#ssec-misc-cycles}

既然写汇编的整个理由就是速度（嗯，还有空间效率），知道每条指令有多快就很重要，这样你才能决定在哪里用哪一条。“周期”这个词其实有两种不同的含义：一个是<dfn>时钟周期</dfn>（clock cycle），衡量时钟滴答的数量；另一个是<dfn>功能周期</dfn>（functional cycle，苦于没有更好的词），指示一条指令的阶段数。在理想世界里这两者应当相等。然而，这是现实世界，我们得对付等待状态和总线宽度，它们让功能周期花费多个时钟周期。<dfn>等待状态</dfn>（wait state）是访问内存的附加成本；内存可能就是没 CPU 本身那么快。内存还有一个固定的<dfn>总线宽度</dfn>（buswidth），指示一个周期内最多能发送的比特数：如果你要传的数据大于内存总线能处理的，就不得不把它切成小块依次通过，花费额外的周期。比如，ROM 有 16 位总线，这对传字节或半字没问题，但字会被当作两个半字来传，花费两个功能周期而非仅一个。如果你还没猜到，这就是为什么 ROM/EWRAM 代码推荐用 Thumb。

功能周期有三种类型：<dfn>非顺序</dfn>（non-sequential，N）、<dfn>顺序</dfn>（sequential，S）和<dfn>内部</dfn>（internal，I）周期。还有第四种，协处理器周期（C），但因为 GBA 没有协处理器，我把它略去了。

总之，N 周期和 S 周期与内存读取有关：如果当前（功能）周期的传输与前一周期无关，它就是非顺序的；否则就是顺序的。大多数指令会是顺序的（来自取指令），但分支和加载/存储可能因为要查找另一个地址而带有非顺序周期。顺序和非顺序周期都受段等待状态影响。内部周期是 CPU 已经在做别的事、所以即便下一动作该做什么很清楚、却只能干等的情形。I 周期不受等待状态影响。

<div class="cblock">
  <table width=80% align="center">
    <tr>
      <td style="border: 1px solid var(--bg);">
        <table id="tbl:cycles" class="table-data">
          <caption align="bottom">
            <b>{*@tbl:cycles}</b>: Cycle times for the most important instructions.
          </caption>
          <tr>
            <th>Instruction</th>
            <th>Cycles</th>
          </tr>
          <tr>
            <td>Data</td>
            <td>1S</td>
          </tr>
          <tr>
            <td>ldr(type)</td>
            <td>1N + 1N<sub>d</sub> + 1I</td>
          </tr>
          <tr>
            <td>str(type)</td>
            <td>1N + 1N<sub>d</sub></td>
          </tr>
          <tr>
            <td>ldm {<i>n</i>}</td>
            <td>1N + 1N<sub>d</sub> + (<i>n</i>-1)S<sub>d</sub>+ 1I</td>
          </tr>
          <tr>
            <td>stm {<i>n</i>}</td>
            <td>1N + 1N<sub>d</sub> + (<i>n</i>-1)S<sub>d</sub></td>
          </tr>
          <tr>
            <td>b/bl/bx/swi</td>
            <td>2S + 1N</td>
          </tr>
          <tr>
            <td>Thumb bl</td>
            <td>3S + 1N</td>
          </tr>
          <tr>
            <td>mul</td>
            <td>1S + <i>m</i>I</td>
          </tr>
          <tr>
            <td>mla/mull</td>
            <td>1S + (<i>m</i>+1)I</td>
          </tr>
          <tr>
            <td>mlal</td>
            <td>1S + (<i>m</i>+2)I</td>
          </tr>
        </table>
      </td>
      <td style="border: 1px solid var(--bg);">
        <table id="tbl:waits"class="table-data">
          <caption align="bottom">
            <b>{*@tbl:waits}</b>: Section default timing details. See also <a href="https://problemkaputt.de/gbatek.htm#gbamemorymap">GBATEK memory map</a>.
          </caption>
          <col>
            <col span=3 align="center">
              <tbody align="center">
                <tr>
                  <th>Section</th>
                  <th>Bus</th>
                  <th>Wait (N/S)</th>
                  <th>Access 8/16/32</th>
                </tr>
                <tr>
                  <th>BIOS </th>
                  <td>32</td>
                  <td>0/0</td>
                  <td>1/1/1</td>
                </tr>
                <tr>
                  <th>EWRAM</th>
                  <td>16</td>
                  <td>2/2</td>
                  <td>3/3/6</td>
                </tr>
                <tr>
                  <th>IWRAM</th>
                  <td>32</td>
                  <td>0/0</td>
                  <td>1/1/1</td>
                </tr>
                <tr>
                  <th>IO</th>
                  <td>32</td>
                  <td>0/0</td>
                  <td>1/1/1</td>
                </tr>
                <tr>
                  <th>PAL</th>
                  <td>16</td>
                  <td>0/0</td>
                  <td>1/1/2</td>
                </tr>
                <tr>
                  <th>VRAM</th>
                  <td>16</td>
                  <td>0/0</td>
                  <td>1/1/2</td>
                </tr>
                <tr>
                  <th>OAM</th>
                  <td>32</td>
                  <td>0/0</td>
                  <td>1/1/1</td>
                </tr>
                <tr>
                  <th>ROM</th>
                  <td>16</td>
                  <td>4/2</td>
                  <td>5/5/8</td>
                </tr>
              </tbody>
            </col>
          </col>
        </table>
      </td>
    </tr>
  </table>
</div>

{_@tbl:cycles} 展示了指令按 N/S/I 周期计的成本。如何得到这些周期时间，下面会解释。{_@tbl:waits} 列出了每个段的总线宽度、等待状态以及以时钟周期计的访问时间。注意这些是默认等待状态，可以在 [REG_WAITCNT](https://problemkaputt.de/gbatek.htm#gbasystemcontrol) 里更改。

这里给出的数据只是最重要项的概览，要查所有龌龊细节，你应该去看 GBATEK 或官方文档。

- 一条指令的成本始于从内存取它，这是一次 1S 操作。对大多数指令来说，也在这里结束。
- 内存指令还得从内存取数据，花费 1N<sub>d</sub>；我在这里加了下标 _d_，因为这是对*数据*所在段的访问，而其他等待状态取自代码所在段。这是重要区别。另外，因为下一条指令的地址和当前地址无关，它的时序会以 1N 而非 1S 开始。这个差异包含在传输时序里。不过注意，大多数文档把 `ldr` 列为 1S+1N+1I，但这是错的！如果你实际测试，会看到它其实是 1N+1N<sub>d</sub>+1I。
- 块传输的表现和常规传输类似，只是第一次之后的所有访问都是 S<sub>d</sub> 周期。
- 分支需要额外的 1N+1S 来跳到新地址并重新填充流水线（我猜的）。任何改变 `pc` 的东西都可被视为分支。Thumb 的 `bl` 实际上是两条指令（或者更确切地说，一条指令加一个地址），这就是为什么它多了一个 1S。
- 寄存器偏移操作给基础成本加 1I，因为值必须先从容寄存器读出才能被应用。
- 乘法是 1S 操作，加上第二操作数每个有效字节 1I。是的，这意味着成本在操作数上是不对称的。如果你能估算操作数的值域，尽量把较小的放在第二操作数。对 `mla` 的加法还要多 1I，对长乘法再多 1I。

:::warning 加载里没有 1S！

官方文档给出 `ldr` 的时序是 1S+1N<sub>d</sub>+1I，但这并不完全准确。它实际上是 1**N**+1N<sub>d</sub>+1I。差别很小，而且只在 ROM 指令上才看得出，但如果你纳闷为什么预测的和实测的例程对不上，可能会很恼火。这同样适用于 `ldm`，可能还有 `swp`。

详见 [forum:9602](https://gbadev.net/forum-archive/thread/8/9602.html)。

:::

### 一条加法的剖析 {#ssec-arm-add}

作为指令如何被格式化的一个例子，我邀请你深入端详 `add` 指令。这会是 GBA 编程的绝对底线，所有层次中最底层的一级。理解它能让你在理解 ARM 汇编的“如何”与“为何”（以及“为何不”！）上走得很远。

在我展示那些位之前，我该指出：`add`（事实上所有数据指令）依第二操作数之不同而有三种形式。它可以是一个立即数字段（数值）、一个立即数偏移寄存器，或一个寄存器偏移寄存器。位 4 和 19h 指示 `add` 的类型，较低的 12 位描述第二操作数；其余对所有 `add` 形式都相同。

<style>
  #tbl\:arm-add {
    & tr td, tr th {
      background-color: var(--bg);
      text-align: center;
    }

    & .bits td {
    padding: 3px 5px !important;
    }
  }
</style>
<div class="reg">
  <table class="table-reg" id="tbl:arm-add" border=1 frame=void cellpadding=2 cellspacing=0>
    <caption class="reg">
      <b>{*@tbl:arm-add}</b>: The add instruction(s)
    </caption>
    <colgroup>
      <col style="width: 30%;">
    </colgroup>
    <tbody style="font-size:75%;">
      <tr class="bits">
        <td>&nbsp;</td>
        <td>1F&nbsp;-&nbsp;1C</td>
        <td>1B&nbsp;1A</td>
        <td>19</td>
        <td>18&nbsp;-&nbsp;15</td>
        <td>14</td>
        <td>13&nbsp;-&nbsp;10</td>
        <td>F&nbsp;-&nbsp;C</td>
        <td>B&nbsp;-&nbsp;8</td>
        <td>7</td>
        <td>6&nbsp;5</td>
        <td>4</td>
        <td>3&nbsp;-&nbsp;0</td>
      </tr>
      <tr class="bf">
        <td style="font:100%,Arial,normal;">add Rd, Rn, #
        <td class="rclr0" rowspan=3>cnd
        <td class="rclr1" rowspan=3>TA
        <td class="rclr2" rowspan=3>IF
        <td class="rclr1" rowspan=3>TB
        <td class="rclr2" rowspan=3>S
        <td class="rclr3" rowspan=3>Rn
        <td class="rclr4" rowspan=3>Rd
        <td class="rclr5" colspan=1>IR
        <td class="rclr6" colspan=6>IN
      </tr>
      <tr class="bf">
        <td style="font:100%,Arial,normal;">add Rd, Rn, Rm Op #
        <td class="rclr5" colspan=2>IS
        <td class="rclr8" rowspan=2>ST
        <td class="rclr7" rowspan=2>SF
        <td class="rclr6" rowspan=2>Rm
      </tr>
      <tr class="bf">
        <td style="font:100%,Arial,normal;">add Rd, Rn, Rm Op Rs
        <td class="rclr5">Rs
        <td> 0
      </tr>
    </tbody>
  </table>
  <br>
  <table class="table-reg-vert">
    <caption>
      Top 20 bits for <code>add</code>; denote instruction type, status/conditional flags and destination and first operand registers.
    </caption>
    <colgroup>
      <col class="bits" width=40>
      <col class="bf" width="8%">
    </colgroup>
    <tr align="left">
      <th>bits</th>
      <th>name</th>
      <th>description</th>
    </tr>
    <tbody valign="top">
      <tr class="bg0">
        <td>C&nbsp;-&nbsp;F</td>
        <td class="rclr4">Rd</td>
        <td><b>Destination register</b>.</td>
      </tr>
      <tr class="bg1">
        <td>10&nbsp;-&nbsp;13</td>
        <td class="rclr3">Rn</td>
        <td><b>First operand register</b>.</td>
      </tr>
      <tr class="bg0">
        <td>14</td>
        <td class="rclr2">S</td>
        <td>Set <b>Status</b> bits (the <code>-s</code> affix).</td>
      </tr>
      <tr class="bg1">
        <td>15-18</td>
        <td class="rclr1">TB</td>
        <td><b>Instruction-type</b> field. Must be 4 for <code>add</code>.</td>
      <tr class="bg0">
        <td>19</td>
        <td class="rclr2">IF</td>
        <td><b>Immediate flag</b>. The second operand is an immediate value if set, and a (shifted) register if clear.</td>
      </tr>
      <tr class="bg1">
        <td>1A&nbsp;-&nbsp;1C</td>
        <td class="rclr1">TA</td>
        <td>Another <b>instruction-type</b> field. Is zero for all data instructions.</td>
      </tr>
      <tr class="bg0">
        <td>1D&nbsp;-&nbsp;1F</td>
        <td class="rclr0">cnd</td>
        <td><b>Condition</b> field.</td>
      </tr>
    </tbody>
  </table>
  <br>
  <table class="table-reg-vert">
    <caption>
      Lower 12 bits for <code>add</code>; these form the second operand.
    </caption>
    <colgroup>
      <col class="bits" width=40>
      <col class="bf" width="8%">
    </colgroup>
    <tbody valign="top">
      <tr align="left">
        <th>bits</th>
        <th>name</th>
        <th>description</th>
      <tr class="bg0">
        <td>0&nbsp;-&nbsp;7</td>
        <td class="rclr6">IN</td>
        <td><b>Immediate Number</b> field. The second operand is <code>IN ror 2*IR</code>.</td>
      </tr>
      <tr class="bg1">
        <td>8&nbsp;-&nbsp;B</td>
        <td class="rclr5">IR</td>
        <td><b>Immediate Rotate</b> field. This denotes the rotate-right amount applied to <i>IN</i>.</td>
      </tr>
      <tr class="bg0">
        <td>0&nbsp;-&nbsp;3</td>
        <td class="rclr6">Rm</td>
        <td><b>Second operand</b> register.</td>
      </tr>
      <tr class="bg1">
        <td>4</td>
        <td class="rclr7">SF</td>
        <td><b>Shift-operand flag</b>. If set, the shift is the immediate value in <i>IS</i>; if clear, the shift comes from register <i>Rs</i>.</td>
      </tr>
      <tr class="bg0">
        <td>5&nbsp;-&nbsp;6</td>
        <td class="rclr8">ST</td>
        <td> <b>Shift type</b>. <b>0</b>: <code>lsl</code>, <b>1</b>: <code>lsr</code> <b>2</b>: <code>asr</code>, <b>3</b>: <code>ror</code></td>
      </tr>
      <tr class="bg1">
        <td>7&nbsp;-&nbsp;B</td>
        <td class="rclr5">IS</td>
        <td><b>Immediate Shift</b> value. Second operand is <code>Rm Op IS</code>.</td>
      </tr>
      <tr class="bg0">
        <td>8&nbsp;-&nbsp;B</td>
        <td class="rclr5">Rs</td>
        <td><b>Shift Register</b>. Second operand is <code>Rm Op Rs</code>.</td>
      </tr>
    </tbody>
  </table>
</div>

这类表格你应该觉得眼熟：没错，在 Tonc 里我也用它们讲过 IO 寄存器。事情的真相是，指令的编码方式非常相似。在这个例子里，你有一个 32 位的值，不同的位域描述指令的类型（`TA`=0 和 `TB`=4 表示是一条 `add` 指令）、所用的寄存器（`Rd`、`Rd`，可能还有 `Rm` 和 `Rs`）以及其他一些东西。我们到现在已经见过这玩意好几次了，所以这里不该有什么理解困难。汇编指令无非是我之前用过几次的 [BUILD 宏](regobj.html#cd-oe-build)，只不过这次是汇编器把它们变成原始数字，而非预处理器。话虽如此，手动构造指令其实是可能的，甚至在运行时也行，但是否真想这么干就是另一回事了。

现在，高 20 位指示它是什么指令、用了哪些寄存器。低 12 位是给 _Op2_ 的。如果这涉及一个偏移寄存器，最低的 4 位指示 `Rm`。位 5 和 6 描述移位操作的类型（左移、右移或循环右移），而依据位 4，位 7 到 11 要么组成一个用于移位的寄存器（`Rs`），要么是一个移位值（5 位，0 到 31）。然后是立即数操作数……

唉。是的，这里就是你给立即数操作数能用的那区区 12 位，分成一个 4 位的循环部分和一个 8 位的立即数部分。允许的立即数由 `IN ror 2*IR` 给出。这看着范围很小，但有趣的是，光靠这些你就能走得很远。这确实意味着你永远无法一步把变量地址加载进寄存器；你得先用一次 PC 相对加载拿到地址，再去加载它的值。

<pre><code class="language-armasm hljs">@ Forming 511(0x101)
    <span class="rem">mov     r0, #511    @ <b>Illegal instruction! D:</b></span>

    mov     r0, #256    @ 256= 1 ror 24, so still valid
    add     r0, #255    @ 256+255 = 511

    @ Load 511 from memory with ldr
    ldr     r0, .L0

    @ Load 511 from memory with special ldr
    @ NOTE: no '#' !
    ldr     r0,=511
.L0:
    .word   511
</code></pre>

总之，{@tbl:arm-add} 的位模式，就是当你使用一条 `add` 指令时处理器实际看到的东西。其他指令长什么样，可以在我前面给的参考资料里看到，尤其是速查表。整个指令集的正交性，体现在同一类指令极其相似的格式上。比如，数据指令仅由 `TB` 字段区分：`add` 是 4，`sub` 是 2，以此类推。

## Thumb 汇编 {#sec-thumb}

Thumb 指令集是 ARM 全套指令的一个子集。Thumb 指令的决定性特征是它们只有 16 位长。结果是，Thumb 里的函数可以比 ARM 里短得多，这在你可用空间不多时会很有利。另一点是，16 位指令能一次穿过 16 位数据总线并立即执行，而 32 位指令的执行则得等到第二块被取来，实际上把指令速度砍了一半。记住，ROM 和 EWRAM——代码的两大主要区域——拥有 16 位总线，这正是为什么建议 GBA 编程用 Thumb 指令。

当然也有缺点；你不能就这么把一条指令的尺寸砍半然后指望全身而退。即便 Thumb 代码用了许多和 ARM 相同的助记符，功能也已被大幅削减。比如，唯一能带条件的指令是分支 `b`；指令不能再使用移位和旋转（现在它们是独立的指令了），而且大多数指令只能用较低的 8 个寄存器（`r0-r7`）；较高的那些仍然可用，但你得把东西移到低寄存器才能用它们。

简而言之，写出高效的 Thumb 代码更具挑战性。它倒不算什么束缚与调教式的编程，但如果你习惯了完整的 ARM 集，时不时会撞上惊喜。Thumb 用了 ARM 的大部分助记符，但其中许多在某种方式上受限，所以学习如何写 Thumb 代码，基本上归结为弄清你*不能再*做什么。有鉴于此，本节将覆盖 ARM 与 Thumb 的差异，而非 Thumb 集本身。

- **被移除的指令**。少数指令被整个砍掉。各种乘法指令里只剩下 `mul`，反向减法（`rsb`、`rsc`）没了，交换和协处理器指令也没了，不过那些本来就很罕见。
- **“新”指令**。助记符是新的，但其实它们只是常规 ARM 指令的特殊情形。Thumb 有独立的移位/旋转 opcode：`lsl`、`lsr`、`asr` 和 `ror` 码，功能上等价于“`mov Rd, Rm, Op2`”。还有一个“`neg Rd,Rm`”表示 _Rd_= 0−*Rm*，本质上就是一条 `rsb`。而我猜你也可以把 `push` 和 `pop` 叫做新的，因为它们在某些开发包里并不作为 ARM opcode 出现。
- **没有条件执行**。分支除外。你好，肆意的标签轰炸 <kbd>:\\</kbd>。
- **设置状态**（Set Status）标志总是开启。所以在 Thumb 里 `sub` 永远表现得像 `subs`，等等。
- **没有桶形移位器**。嗯，它当然还在；只是你不能再把它和指令一起用了。这就是为什么有了独立的位偏移/旋转 opcode。
- **寄存器可用性受限**。除非显式说明，否则指令只能用 `r0-r7`。例外是 `add`、`mov` 和 `cmp`，它们有时能用高寄存器作操作数。这个限制也适用于内存操作，小例外：`ldr/str` 仍能用 PC 或 SP 相对的东西；`push` 允许 `lr` 在它的寄存器列表里，`pop` 允许 `pc`。有了这些，你能快速从函数返回，但为此你反正该用 `bx`。幸好 `bx` 也允许使用每个寄存器，所以你仍能写“`bx lr`”。
- **几乎没有立即数或第二操作数支持**。在 ARM 代码里，大多数指令允许一个第二操作数 _Op2_，它既可以是立即数也可以是一个（被偏移过的）寄存器。大多数 Thumb 数据指令是“_`ins`_` Rd, Rm`”的形式，对应 C 的赋值运算符如 `+=` 和 `|=`。注意 `Rm` 是个寄存器，不是立即数。唯一打破这个模式的是移位码、`add`、`sub`、`mov` 和 `cmp`，它们既能带立即数也能带第二操作数。详见参考文档。
- **内存指令里没有写回**。这意味着遍历数组时你至少得多用一个寄存器和多条指令。对此只有一个例外，即块传输。仅存下来的版本是 `ldmia` 和 `stmia`，而且在这两个版本里写回其实是必需的。
- **内存操作很刁钻**。嗯，确实！ARM 内存 opcode 在能力上是完全相同的，但这里你得打起精神。一些特性整个没了（写回和偏移寄存器），其他的也不总对所有的类型可用。寄存器偏移寻址永远可用，但立即数偏移对有符号加载（`ldrsh`、`ldrsb`）不起作用。记住寄存器只能是 `r0-r7`，`ldr/str` 除外：那里你也能用 PC 和 SP 相对的东西（带立即数偏移）。{\*@tbl:thumb-mem} 给出了概览。
  <div style="margin:0.5em;">
    <table id="tbl:thumb-mem" class="table-data">
      <caption align="bottom">
        <b>{*@tbl:thumb-mem}</b>. Thumb addressing mode availability.
      </caption>
      <colgroup>
        <col align="right" />
        <col span=3 align="center" />
      </colgroup>
      <tbody align="center">
        <tr>
          <td>&nbsp;</td>
          <th>[Rn,Rm]</th>
          <th>[Rn,#]</th>
          <th>[pc/sp,#]</th>
        </tr>
        <tr>
          <th>ldr/str</th>
          <td>+</td>
          <td>+</td>
          <td>+</td>
        </tr>
        <tr>
          <th>ldrh/strh</th>
          <td>+</td>
          <td>+</td>
          <td>-</td>
        </tr>
        <tr>
          <th>ldrb/strb</th>
          <td>+</td>
          <td>+</td>
          <td>-</td>
        </tr>
        <tr>
          <th>ldrsh/ldrsb</th>
          <td>+</td>
          <td>-</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
  </div>
  实际上，“`ldrh Rd,=X`”似乎也能用，但它们内部其实被转换成了“`ldr Rd,=X`”。

就这些？嗯，不全是，但也够多了。记住，Thumb 本质上是 ARM Lite：看着像，却丢掉了大量实质。我建议也用这种方式学 Thumb 代码：先学 ARM，再学你不能再做什么。这份清单给出了你需要知道的大部分东西；其余的，就看你时不时从汇编器那里收到的信息，并从经验中学习吧。

## GAS：GNU 汇编器 {#sec-gas}

指令只是可用汇编的一部分，你还需要<dfn>伪指令</dfn>（directives）来把代码串起来、控制段和对齐、创建数据等等。颇为贴切的是，伪指令似乎和汇编本身一样不可移植：一套汇编器的伪指令在另一套下可能根本不能用。

本节介绍 GNU 汇编器 GAS 的主要伪指令。既然我们已经在用 GNU 工具链，选这个汇编器相当显然。GAS 本来就是正常构建流程的一部分，所以没有真正的功能损失，而且你能像对待其他汇编一样轻松地和 C 文件协作；对 GCC 来说它们都是一回事。另一个好特性是你能用预处理器，所以如果你有只含预处理器内容（仅 #include 和 #define）的头文件，这里也能用。当然，你本来也能那么做，因为 `cpp` 是个独立工具，但这里你不必求助于花招。

回到伪指令。本节你会看到一些最基本的伪指令。这包括为函数（ARM 和 Thumb 都有）和变量创建符号。没有这些你什么都做不了。我还会讲基本数据类型，以及如何把东西放进特定段。还有不少其他伪指令，但这些应该是最有用的。完整列表请看 [GAS 手册](https://sourceware.org/binutils/docs-2.22/as/index.html)（在 www.gnu.org）。

### 符号 {#ssec-gas-sym}

数据（变量和常量）和函数被统称为<dfn>符号</dfn>（symbols），而且就像在 C 里那样，它们有声明和定义。任何标签（单独一行、以冒号结尾的合法标识符）都潜在是一个符号定义，但最好区分全局标签和局部标签。简单说，如果一个标签附有“`.global `_`lname`_”伪指令让它对外可见，那它就是全局的。其他一切都是局部的，按约定以“`.L`”开头，虽然这并非必需。如果你想用外面的符号，就得用“`.extern `_`lname`_”。

现在，除非你用了某种记法手段，否则一个标签不会告诉你它到底代表什么：它不提供任何关于它是数据还是函数的信息，也不提供后者的参数个数。有个“`.type, `_str_”伪指令能让你指示它是函数（_str_ = `%function`）还是某种数据（_str_ = `%object`），但也仅此而已。既然你可以通过看标签之后的内容来判断那个区别，我往往把它省了。其他信息，请就符号的含义写注释。

你用于数据的伪指令通常会告诉你数据类型是什么，但那是后面小节的事。现在，我讲几个用于函数的伪指令。最重要的是“`.code `_`n`_”，其中 _n_ 对 ARM 或 Thumb 代码分别是 32 或 16。你也可以用更具描述性的 `.arm` 和 `thumb` 伪指令，它们做一样的事。这些是全局设置，保持有效直到你改变它们。另一个重要的伪指令是 `.thumb_func`，对 Thumb 函数的互操作是**必需**的。这个伪指令作用于下一个符号标签。实际上，`.thumb_func` 已经隐含了 `.thumb`，所以显式加后者并非必要。

一个非常重要又狡猾的问题是**对齐**。**你**负责对齐代码和数据，不是汇编器。在 C 里，编译器替你做这件事，你唯一可能遇到麻烦的时候，是[对齐不匹配](bitmaps.html#ssec-data-align)的强制类型转换；但这里代码*和*数据都可能未对齐；在汇编里，汇编器只是把你给的代码和数据原样串起来，所以一旦你开始用字以外的任何东西，就可能出现未对齐。

幸好，对齐非常容易做：“`.align `_`n`_”对齐到下一个 2<sup>n</sup> 字节边界；如果你不喜欢这里 _n_ 是幂次这点，也可以用“`.balign `_`m`_”，它对齐到 _m_ 字节。这些会更新当前位置，使下一项事务得到恰当对齐。是的，它作用于*下一项*代码/数据；它不是全局设置，所以如果你打算混合不同大小的数据，请准备好频繁对齐。

这里是一些这些要素在实践中如何运作的例子。把它们视作创建和使用符号的标准样板材料。

```armasm
@ ARM and Thumb versions of m5_plot
@ extern u16 *vid_page;
@ void m5_plot(int x, int y, u16 clr)
@ {   vid_page[y*160+x]= clr;    }

@ External declaration
@ NOTE: no info on what it's a declaration of!
    .extern vid_page            @ extern u16 *vid_page;

@ ARM function definition
@ void m5_plot_arm(int x, int y, u16 clr)
    .align 2                    @ Align to word boundary
    .arm                        @ This is ARM code
    .global m5_plot_arm         @ This makes it a real symbol
    .type m5_plot_arm STT_FUNC  @ Declare m5_plot_arm to be a function.
m5_plot_arm:                    @ Start of function definition
    add     r1, r1, lsl #2
    add     r0, r1, lsl #5
    ldr     r1,=vid_page
    ldr     r1, [r1]
    mov     r0, r0, lsl #1
    strh    r2, [r1, r0]
    bx      lr

@ Thumb function definition
@ void m5_plot_thumb(int x, int y, u16 clr)
    .align 2                    @ Align to word boundary
    .thumb_func                 @ This is a thumb function
    .global m5_plot_thumb       @ This makes it a real symbol
    .type m5_plot_thumb STT_FUNC    @ Declare m5_plot_thumb to be a function.
m5_plot_thumb:                  @ Start of function definition
    lsl     r3, r1, #2
    add     r1, r3
    lsl     r1, #5
    add     r0, r1
    ldr     r1,=vid_page
    ldr     r1, [r1]
    lsl     r0, #1
    strh    r2, [r1, r0]
    bx      lr
```

上面的函数展示了函数的基本模板：三行伪指令，加上一个函数标签。注意这四条伪指令没有强制的顺序，所以你也可能见到别的排法。事实上，`.global` 伪指令完全可以和函数其余代码彻底分开。另请注意对 `vid_page` 使用 `.extern` 以允许访问，它在 libtonc 里总是指向当前的后台缓冲（back buffer）。老实说，这甚至不必要，因为 GAS 假定所有未知标识符都来自其他文件；不过尽管如此，我还是建议你用它，纯粹为了维护性。

是的，这两个函数确实构成了可用的模式 5 像素绘制器。作为练习，试着搞清它们如何工作、以及为什么写成那样。另外，注意 Thumb 函数只比 ARM 版本长了两条指令；如果这是 ROM 代码，Thumb 版本会因为总线宽度而快很多，这正是那里推荐 Thumb 代码的原因。

:::warning GCC 4.7 提示：函数现在需要符号类型

从 GCC 4.7 起，`.type` 伪指令对函数来说基本是必需的。或者更准确地说，如果你想要 ARM 和 Thumb 互操作可用，它就是必需的。只需给每个函数定义加上下面这行：

```armasm
    .type [function-name] STT_FUNC
```

`STT_FUNC` 是一个内部宏，展开成正确的属性（大概是 `%function`）。把 `[function-name]` 换成真正的函数名。

:::

:::danger 隐式 extern 被视为有害

用于外部符号的 `.extern` 伪指令其实不是必需的：GAS 假定未知标识符都是外部的。虽然我能看到隐式声明/定义的好处，我仍然认为这是个*坏*主意。如果你曾在有隐式定义的语言里拼错过标识符，就会知道为什么。

是的，我知道这其实不是个问题，因为链接器反正会抓住它，但显式声明 extern 可能仍是个好主意。 <kbd>:P</kbd>

:::

### 变量的定义 {#ssec-gas-data}

当然，你在汇编里也能有数据，但在那之前，先讲几句可接受的数字格式和数字用途。GAS 使用和 C 一样的数字表示：普通数字表示十进制，“`0`”表示八进制，“`0x`”表示十六进制。还有二进制表示，用“`0b`”前缀：比如 `0b1100` 是 12。我已经用过几次数字了，你应该已经注意到它们有时前缀一个“`#`”。这个符号其实不是数字的一部分，而是立即数的指示符。

在汇编里对数字做算术也是可能的。也就是说，你可以用类似“`mov r0, #1+2+3+4`”的东西把 10 加载进 `r0`。不仅算术，位操作也能用，这在你想构造掩码或颜色时会很方便。注意，这仅对常量有效。

现在来讲给你的代码加数据。主要的数据伪指令是 `.byte`、`.hword` 和 `.word`，分别创建字节、半字和字。如果你愿意，也可以把 `.float` 算进去，但你不会想用，因为浮点在 GBA 上是邪恶的。它们的用法很简单：把伪指令写在一行并跟一个数字，或者甚至用逗号分隔的列表来写数组。如果你在数据前加一个标签，你就拥有了一个变量。还有几个用于字符串的伪指令，即 `.ascii`、`.asciz` 和 `.string`。`.asciz` 和 `.string` 不同于 `.ascii` 的地方在于它们会给字符串加上结束符 '`\0`'，而那正是字符串通常的工作方式。就像其他数据伪指令一样，你可以用逗号分隔来做一个字符串数组。

你可以在下面看到一些例子；注意那本应是 `hword_var` 的东西肯定会未对齐，因此没用。

<pre><code class="language-armasm hljs">    .align 2
word_var:               @ int word_var= 0xCAFEBABE
    .word   0xCAFEBABE
word_array:             @ int word_array[4]= { 1,2,3,4 }
    .word   1, 2, 3, 4      @ NO comma at the end!!
byte_var:               @ char byte_var= 0;
    .byte   0
hword_var:              <span class="rem">@ NOT short hword_var= 0xDEAD;</span>
    .hword  0xDEAD      <span class="rem">@   due to bad alignment!</span>
str_array:                 @ Array of NULL-terminated strings:
    .string &quot;Hello&quot;, &quot;Nurse!&quot;
</code></pre>

### 数据段 {#ssec-gas-dsec}

既然你已经知道如何造代码和变量，你得把它们放进恰当的段（section）。<dfn>段</dfn>是存放代码和数据的封闭区域；链接器用一个链接脚本来看不同段都在哪里，然后把你的所有符号加进去并相应链接。段的格式是“`.section `_`secname`_”，可选带上我稍后会讲的“`, "`_`flags`_`", %`_`type`_”信息。

传统上，代码段叫 `.text`，数据段叫 `.data`，但还有几个值得考虑：通用段 `.bss` 和 `.rodata`，以及 GBA 专用的 `.ewram` 和 `.iwram`。原则上，这四种都是数据段，但通过设置正确的段标志，它们也能用于代码。你可能已经猜到，`.ewram` 代表 EWRAM 段（0200:0000h），`.iwram` 是 IWRAM（0300:0000h），`.rodata` 是 ROM（0800:0000）。`.bss` 段是一个用于“要么未初始化、要么填零”的变量的段。这个段的好处是它不需要 ROM 空间，因为它在那儿没有数据要存。这个段会被放在 IWRAM 里，就像 `.data` 一样。你偶尔也会看到 `.sbss`，意为“small bss”（小 bss），功能和标准 `.bss` 类似，但碰巧被放在 EWRAM 里。

这些数据段可用来指示不同种类的数据符号。比如，常量（C 关键字 `const`）应进入 `.rodata`。非零（且显然非 const）的已初始化数据进入 `.data`，零或未初始化的数据则放进 `.bss`。现在，你仍得为每个 bss 变量指明所需的存储量。这可以用“`.space `_`n`_”完成，它指示 _n_ 个零字节（另见 `.fill` 和 `.skip`），或者用“`.comm `_`name`_`, `_`n`_`, `_`m`_”，它创建一个名为 _name_ 的 bss 符号，为它分配 _n_ 字节并把它对齐到 _m_ 字节。GCC 喜欢对未初始化变量用这个。

```c
// C symbols and their asm equivalents

// === C versions ===
int var_data= 12345678;
int var_zeroinit= 0;
int var_uninit;
const u32 cst_array[4]= { 1, 2, 3, 4 };
u8 charlut[256] EWRAM_BSS;
```

```armasm
@ === Assembly versions ===
@ Removed alignment and global directives for clarity

@ --- Non-zero Initialized data ---
    .data
var_data:
    .word   12345678

@ -- Zero initialized data ---
    .bss
var_zeroinit:
    .space    4

@ --- Uninitialized data ---
@ NOTE: .comm takes care of section, label and alignment for you
@   so those things need not be explicitly mentioned
    .comm var_uninit,4,4

@ --- Constant (initialized) data ---
    .section .rodata
cst_array:
    .word 1, 2, 3, 4

@ --- Non-zero initialized data in ewram ---
    .section .sbss
charlut:
    .space 256
```

:::tip 把汇编用作数据导出器

汇编是导出数据的好格式。汇编数组比编译更快，文件可以更大，而且你能更容易地控制对齐。哦对了，你也不会被诱惑去 #include 数据，因为那根本行不通。

```armasm
    .section .rodata    @ in ROM, please
    .align  2           @ Word alignment
    .global foo         @ Symbol name
foo:
    @ Array goes in here. Type can be .byte, .hword or .word
    @ NOTE! No comma at the end of a line! This is important
    .hword  0x0000,0x0001,0x0002,0x0003,0x0004,0x0005,0x0006,0x0007
    .hword  0x0008,0x0009,0x000A,0x000B,0x000C,0x000D,0x000E,0x000F
    .hword  0x0010,0x0011,0x0012,0x0013,0x0014,0x0015,0x0016,0x0017

    ...
```

你需要一个 const 段、字对齐、一个符号声明和定义，以及某种形式的数组数据。要用它，在 C 里做一个合适的数组声明就万事俱备了。

:::

### 代码段 {#ssec-gas-csec}

那是不同段里的数据，现在轮到代码。代码的常规段是 `.text`，它会依据链接器规格等同于 ROM 或 EWRAM。有时，你会想把代码放在 IWRAM 里，因为它比 ROM 和 EWRAM 快得多。你或许以为“`.section .iwram`”能搞定，但不幸这似乎通常不成立。因为 IWRAM 实际上是个数据段，你在这里也得加上段类型信息。完整的段声明需要是“`.section .iwram, "ax", %progbits`”，它把段标记为可分配和可执行（`"ax"`），并且段也含有数据（`%progbits`），虽然最后这点似乎不是必需的。

另一个有趣的点是，一旦你把函数放进 IWRAM，该如何调用它。问题是 IWRAM 离 ROM 太远，无法一步跳到。所以要让它工作，你得把函数的地址加载进一个寄存器，然后用 `bx` 跳到它。当然，还要把 `lr` 设到正确的返回地址。通常的做法是把函数的地址加载进一个寄存器，然后分支到一个只由使用该寄存器的 `bx` 组成的哑函数。GCC 把这些支撑函数命名为 `_call_via_`_`rx`_，其中 _rx_ 是你想要用的寄存器。这些名字遵循 {@tbl:regnames} 里给出的 GCC 命名方案。

```armasm
@ --- ARM function in IWRAM: ---
    .section .iwram, "ax", %progbits
    .align 2
    .arm
    .global iw_fun
    .type iw_fun STT_FUNC
iw_fun:
    @ <code goes in here>

@ --- Calling iw_fun somewhere ---
    ldr r3,=iw_fun      @ Load address
    bl  _call_via_r3   @ Set lr, jump to long-call function

@ --- Provided by GCC: ---
_call_via_r3:
    bx  r3      @ Branch to r3's address (i.e., iw_fun)
                @ No bl means the original lr is still valid
```

`_call_by_`_`rx`_ 这种间接分支，正是你使用 `-mlong-calls` 编译器标志时函数调用的工作方式。它比直接分支稍慢，但通常更安全。顺便说一句，互操作也是用这种方式实现的。

:::note 标准段与特殊段

`.text`、`.data` 和 `.bss` 是标准 GAS 段，不需要显式提及 `.section` 伪指令。`.ewram`、`.iwram`、`.rodata` 和 `.sbss` 以及更多段是更 GBA 专用的，前面确实需要 `.section`。

:::

有了这些信息，你应该能创建函数、变量，甚至把它们放进正确的段。这大概已经是你用伪指令想做之事的 90% 了。剩下少数，去读手册或翻翻 GCC 生成的汇编。两者都应该给你指对方向。

## 真实世界示例：快速 16/32 位拷贝器 {#sec-cpy}

在最后一节，我会给出两个汇编函数——一个 ARM、一个 Thumb——用于快速拷贝数据，并带有对齐的安全检查。它们叫 `memcpy16()` 和 `memcpy32()`，我在 Tonc 里已经用过好几次了。`memcpy32()` 做 `CpuFastSet()` 做的事，但不要求字计数是 8 的倍数。因为这是一个主函数，它被放进 IWRAM 作为 ARM 代码。`memcpy16()` 用于 16 位数据，并在源和目的的对齐允许、且拷贝数量值得时调用 `memcpy32()`。因为它主要的工作是决定是否用 `memcpy32`，这个函数可以留在 ROM 里作为 Thumb 代码。

这不单单是个练习；这些函数是要拿来用的。它们经过优化，并利用了 ARM/Thumb 汇编的大部分特性。本章涵盖的几乎每一样东西都能在这里找到，所以我希望你跟上了。为了让事情稍容易些，我也在这里加了等价的 C 代码，这样你可以对比两者。

另外，这些函数不只用于纯汇编项目，也能和 C 代码协同使用，我也会展示怎么做。既然你已经见过使用这些函数的演示，而毫无迹象表明它们是汇编函数（除了我说过），这部分其实并不难。这就是本节的安排。准备好了？我们开始。

### memcpy32() {#ssec-cpy-32}

这个函数会拷贝字。*快*。思路是尽可能用 8 倍块传输（就像 `CpuFastSet()`），然后用简单传输拷贝余下 0 到 7 个字。是的，人们可以为此构造一个精巧的测试与块传输结构，把这些残余也一次性做完，但我真不觉得那值得。

你可以用 C 为它写一个函数，下面就是。然而，即便 GCC 确实对 BLOCK 结构体拷贝用了块传输，我只见过它做到 4 倍 `ldm/stm`。再者，它往往用了比严格必要更多的寄存器。你可以说 GCC 没把活干好，但要理解人类的意思确实很难，对吧？如果你想尽可能高效，就自己动手干。而这也正是我们到此来做的，当然。

```c
// C equivalent of memcpy32
typedef struct BLOCK { u32 data[8]; } BLOCK;

void memcpy32(void *dst, const void *src, uint wdcount) IWRAM_CODE
{
    u32 blkN= wdcount/8, wdN= wdcount&7;
    u32 *dstw= (u32*)dst, *srcw= (u32*)src;
    if(blkN)
    {
        // 8-word copies
        BLOCK *dst2= (BLOCK*)dst, *src2= (BLOCK*)src;
        while(blkN--)
            *dst2++ = *src2++;
        dstw= (u32*)dst2;  srcw= (u32*)src2;
    }
    // Residual words
    while(wdN--)
        *dstw++ = *srcw++;
}
```

C 版本应该足够好跟。要拷贝的字数 `wdcount` 被拆成一个块计数和残余字数。如果有完整的块要拷，我们就那么做，并调整指针使残余正确拷贝。注意 `wdcount` 是要拷贝的字数，而非字节数，而且假设 `src` 和 `dst` 是字对齐的。

汇编版本——惊喜，惊喜——做的是完全一样的事，只是比 GCC 生成的更高效。关于它*做什么*，我没什么好补充的，因为所有东西都讲过了，但关于它*怎么做*，有几点值得多留意。

首先，注意总体程序流程。`movs` 给出要拷贝的块数，如果那是零，我们就立即跳到残余部分 `.Lres_cpy32`。那里发生的事也很有趣：在递减字数（在 `r12` 里）之后的三条指令都带着 `cs` 标志。这意味着如果 `r12` 是（无符号）小于 1（即 `r12`==0），这些指令就被忽略。这正是我们想要的，但通常循环体之前会有一个单独的零值检查，那些额外指令要花空间和时间的。通过巧妙运用条件执行，我们能省掉它们。

主循环不用这些条件，而且似乎也没有零值检查。这里的检查其实也在那些 `movs` 行完成：如果它没跳，我们就可以确信还有块要拷，所以另一次检查是多余的。另请注意，非暂存寄存器 `r4-r10` 只有当我们确信它们真会被用时才压栈。GCC 通常在函数的开头和结尾压栈，但没有理由不把它推迟到真正必要之时。

最后，几句非汇编的话。首先，总体布局：我对除标签外的一切用一级缩进，有时对高级语言里会是循环或 if 块的东西用更多级。两者都非必需，但我发现这能让阅读更容易。我还确保指令参数都对齐，这最好是在助记符本身留 8 个空格的情况下。缩进怎么设是个人偏好，也是许多圣战的主题，所以我这里不碰这个 <kbd>:P</kbd>

另一点是注释。注释在汇编里比在 C 里更重要，但别做过头！过度注释只会淹没掉真正有用的注释，甚至可能是代码本身。对代码块、每个寄存器是什么、也许还有重要的测试/分支写注释，但你真的需要说“`subs r2, r2, #1`”是在递减循环变量吗？不，我也觉得不需要。如果你想在 C 里用它，给出函数的预期声明也许也有帮助。

还有，在函数标签前总是加上段、对齐和代码集是个好主意。是的，这些并非严格必需，但如果某个笨蛋决定在文件中间加一个函数，把跟随它的函数的这些设置搞砸了呢？最后，试着区分符号标签和分支标签。GCC 的做法是让后者以“`.L`”开头，这和其他任何约定一样好。

```armasm
@ === void memcpy32(void *dst, const void *src, uint wdcount) IWRAM_CODE; =============
@ r0, r1: dst, src
@ r2: wdcount, then wdcount>>3
@ r3-r10: data buffer
@ r12: wdn&7
    .section .iwram,"ax", %progbits
    .align  2
    .code   32
    .global memcpy32
    .type   memcpy32 STT_FUNC

memcpy32:
    and     r12, r2, #7     @ r12= residual word count
    movs    r2, r2, lsr #3  @ r2=block count
    beq     .Lres_cpy32
    push    {r4-r10}
    @ Copy 32byte chunks with 8fold xxmia
    @ r2 in [1,inf>
.Lmain_cpy32:
        ldmia   r1!, {r3-r10}
        stmia   r0!, {r3-r10}
        subs    r2, #1
        bne     .Lmain_cpy32
    pop     {r4-r10}
    @ And the residual 0-7 words. r12 in [0,7]
.Lres_cpy32:
        subs    r12, #1
        ldrcs   r3, [r1], #4
        strcs   r3, [r0], #4
        bcs     .Lres_cpy32
    bx  lr
```

### memcpy16() {#ssec-cpy-16}

半字拷贝器 `memcpy16()` 的活儿其实不是拷半字。如果可能，它会对能用的地址用 `memcpy32()`，自己只处理剩余的半字部分（如果有的话）。因为它自己不怎么拷贝，我们不必用 IWRAM 来浪费它；这个例程可以留在 ROM 里作为普通 Thumb 函数。

两个因素决定是否跳到 `memcpy32()` 有益。首先是待拷贝的半字数（`hwcount`）。我跑过若干次检查，似乎盈亏平衡点大约是 6 个半字。在那个点，IWRAM 里字拷贝的威力已经盖过了函数调用开销和 Thumb/ROM 代码的成本。

第二是进来的源和目的地址能否被解析为字地址。如果源和目的的 bit 1 相等（bit 0 为零，因为它们是合法的半字地址），这就成立，换句话说：`(src^dst)&2` 不应为零。如果可解析，如有必要就先拷一个半字来字对齐地址，然后对所有的字拷贝调用 `memcpy32()`。之后，调整原有的半字内容，如果还有剩余（或者 `memcpy32()` 用不了），就按半字拷贝。

```c
// C equivalent of memcpy16
void memcpy16(void *dst, const void *src, uint hwcount)
{
    u16 *dsth= (u16*)dst, *srch= (u16*)src;
    // Fast-copy if and only if:
    //   (1) enough halfwords and
    //   (2) equal src/dst alignment
    if( (hwcount>5) && !(((u32)dst^(u32)src)&2) )
    {
        if( ((u32)src)&1 )  // (3) align to words
        {
            *dsth++= *srch++;
            hwcount--;
        }
        // (4) Use memcpy32 for main stint
        memcpy32(dsth, srch, hwcount/2);
        // (5) and adjust parameters to match
        srch += hwcount&~1;
        dsth += hwcount&~1;
        hwcount &= 1;
    }
    // (6) Residual halfwords
    while(hwcount--)
        *dsth++ = *srch++;
}
```

C 版本因为所有那些强制类型转换和掩码而不算漂亮，但够用。如果你把它编译了再和下面的汇编对比，应该能看到许多相似之处，但不会完全相等，因为汇编程序员被允许比 GCC 更大的自由，而且不必和 C 的语法较劲。

总之，在函数真正开始前，我先写出声明、寄存器的用途，以及函数的标准样板。因为我需要超过 4 个寄存器，而且在调用一个函数，我需要把 `r4` 和 `lr` 压栈。这次我在函数的开头和结尾做这件事，因为不那样太麻烦了。有件事可能显得奇怪：为什么我分开弹出 `r4` 然后 `r3`，尤其因为我需要的是 `lr` 而非 `r3`。记住寄存器限制：`lr` 其实是 `r14`，它能被 `push` 触及，却不能被 `pop` 触及。所以这里我改用 `r3`。我把它和 `r4` 弹出分开，也是因为“`pop {r4,r3}`”会以错误的顺序弹出寄存器（低寄存器先加载）。

其余代码遵循 C 代码的结构；我加了编号的点来指示我们所在的位置。第 1 点检查大小，第 2 点检查源和目的的相对对齐。注意我这里实际做的不是和 2 做 AND，而是移位 31，把 bit 1 推进进位标志；Thumb 代码只能在寄存器间 AND，而与其把 2 放进一个寄存器再 AND，我干脆检查进位标志。你当然也能用符号位来移位，那正是 GCC 会做的。我做类似的事来检查指针是否已经是字对齐的，或者我是否得自己来做。

在第 4 点，我设定并调用 `memcpy32()`。或者更确切地说，我调用 `_call_via_r3`，由它去调用 `memcpy32()`。我不能直接用“`bl memcpy32`”，因为它在 IWRAM 里，而 `memcpy16()` 在 ROM 里，距离实在太远。`_call_via_r3` 是一个（在 ROM 里的）中介，只由“`bx r3`”组成，而既然 `memcpy32()` 的地址在 `r3` 里，我们就到了想去的地方。从 `memcpy32()` 返回会正常工作，因为那是由对 `_call_via_r3` 的调用设置的。

C 代码里第 5 点的内容是调整源和目的指针，以计入 `memcpy32()` 完成的工作；在汇编代码里，我是个非常狡猾的混蛋，根本没做那任何一点。事情是这样的：在 `memcpy32()` 结束后，`r0` 和 `r1` 本来*就已经*在我想要的位置了；虽然规则说 `r0-r3` 会被函数调用破坏、因此应当被压栈，但如果我*知道*它们只会变成我想要的样子，我真的还需要做那额外的活吗？我觉得不必。够公道了，这不是推荐的做法，但如果你不能偶尔耍点小花招，汇编编程的乐趣何在？总之，来自 `r4` 的右移抵消了我之前做进 `r4` 的左移，对应一个 `r2&1`；其后的测试检查结果是零，意味着我已完成、现在可以退出了。

最后，第 6 点涉及半字拷贝循环。我本不会在这里提它，除了一点小细节：数组是*倒着*拷回的！如果这是 ARM 代码，我会用後索引，但这是 Thumb 代码，没有那种生物，我被困在只能用偏移。我本可以用另一个寄存器做递增偏移（每循环一条额外指令），或者递增 `r0` 和 `r1`（每循环两条额外），或者我可以倒着拷，效果一样好。还要注意我在循环末尾用的是 `bcs` 而非 `bne`；`bcs` 在这里是关键，因为 `r2` 在第一次计数时可能已经是 0，而那会被 `bne` 漏掉。

```armasm
@ === void memcpy16(void *dst, const void *src, uint hwcount); =============
@ Reglist:
@  r0, r1: dst, src
@  r2, r4: hwcount
@  r3: tmp and data buffer
    .text
    .align  2
    .code   16
    .thumb_func
    .global memcpy16
    .type   memcpy16 STT_FUNC
memcpy16:
    push    {r4, lr}
    @ (1) under 5 hwords -> std cpy
    cmp     r2, #5
    bls     .Ltail_cpy16
    @ (2) Unreconcilable alignment -> std cpy
    @ if (dst^src)&2 -> alignment impossible
    mov     r3, r0
    eor     r3, r1
    lsl     r3, #31         @ (dst^src), bit 1 into carry
    bcs     .Ltail_cpy16    @ (dst^src)&2 : must copy by halfword
    @ (3) src and dst have same alignment -> word align
    lsl     r3, r0, #31
    bcc     .Lmain_cpy16    @ ~src&2 : already word aligned
    @ Aligning is necessary: copy 1 hword and align
        ldrh    r3, [r1]
        strh    r3, [r0]
        add     r0, #2
        add     r1, #2
        sub     r2, #1
    @ (4) Right, and for the REAL work, we're gonna use memcpy32
.Lmain_cpy16:
    lsl     r4, r2, #31
    lsr     r2, r2, #1
    ldr     r3,=memcpy32
    bl      _call_via_r3
    @ (5) NOTE: r0,r1 are altered by memcpy32, but in exactly the right
    @ way, so we can use them as is.
    lsr     r2, r4, #31
    beq     .Lend_cpy16
    @ (6) Copy residuals by halfword
.Ltail_cpy16:
    sub     r2, #1
    bcc     .Lend_cpy16     @ r2 was 0, bug out
    lsl     r2, r2, #1      @ r2 is offset (Yes, we're copying backward)
.Lres_cpy16:
        ldrh    r3, [r1, r2]
        strh    r3, [r0, r2]
        sub     r2, r2, #2
        bcs     .Lres_cpy16
.Lend_cpy16:
    pop     {r4}
    pop     {r3}
    bx  r3
```

### 在 C 中使用 memcpy32() 与 memcpy16() {#ssec-cpy-c}

当你还在让眼睛恢复焦距时，讲个小故事：如何从 C 调用这些函数。其实简单得离谱：你只需要一个声明。没错，就这。GCC 真的不在乎函数是用什么语言写的，它唯一要求的是它们有一致的内存接口，正如 AAPCS 所涵盖的。既然我基本遵守了这个标准（嗯，大体上），这里就没问题。

```c
// Declarations of memcpy32() and memcpy16()
void memcpy16(void *dst, const void *src, uint hwcount);
void memcpy32(void *dst, const void *src, uint wdcount) IWRAM_CODE;

// Example use
{
    extern const u16 fooPal[256];
    extern const u32 fooTiles[512];

    memcpy16(pal_bg_mem, fooPal, 256);      // Copy by halfword. Fine
    memcpy32(pal_bg_mem, fooPal, 256/2);    // Copy by word; Might be unsafe
    memcpy32(tile_mem, fooTiles, 512);      // Src is words too, no prob.
}
```

看到了？它们能像任何其他 C 函数一样被调用。当然，你得汇编并链接汇编文件，而不是 #include 它们，但那本就是你应该构建项目的方式。

不过你确实得小心提供*正确*的声明。声明告诉编译器函数期望如何被调用，这里是目的和源指针（按此顺序），以及要传输的（半）字数。改变参数的顺序或增删一些是合法的——函数不会*工作*了，但编译器确实允许。对 C 函数也一样，这本该是显而易见的一点，但汇编函数不提供简便的检查来确定你是否用了正确的声明，所以请务必小心。

:::tip 让声明契合函数

这是非常重要的一点。每个函数对如何被调用都有期望。声明的段、返回类型和参数必须和函数的相匹配，否则混乱就会降临。最好的办法大概是在函数定义附近显式写出完整声明，这样用户只需复制粘贴即可。

:::

:::tip 对 C++ 使用 'extern "C"'

C++ 的声明略有不同，因为它预期有[名字改编](https://en.wikipedia.org/wiki/Name_mangling)（name mangling）。为了表明函数名*没有*被改编，在声明里加上“`extern "C"`”。

```c++
// C++ declarations of memcpy32() and memcpy16()
extern "C" void memcpy16(void *dst, const void *src, uint hwcount);
extern "C" void memcpy32(void *dst, const void *src, uint wdcount) IWRAM_CODE;
```

:::

就是这样了，伙计们。至少就本章而言。像所有语言一样，彻底掌握它的里里外外要花时间，但有了这些信息，加上几份（速查）参考文档，你应该能写出一些不错的 ARM 汇编，或者至少能读得相当好。写汇编时请务必保持警觉。不只在于努力避开 bug，也在于保持汇编的可维护性。在 C 里不留神已经够糟了，但在这里可能是绝对的灾难。先想清楚你想要做什么，*然后*才开始写指令。

还要记住：是的，汇编写起来可以很有趣。把它想成那种打乱拼图之一：你手里有一把碎片（寄存器）和摆弄它们的方式。目标是以最少的步数抵达最终画面。比如，看看一个[优化过的调色板混合例程](https://gbadev.net/forum-archive/thread/8/6721.html#53322)会长什么样。现在轮到你了 <kbd>:P</kbd>。 <!-- note: Forum archive doesn't have anchors or syntax highlighting... we should fix that! -->
