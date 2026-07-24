# 17. BIOS 调用

<!-- toc -->

<br>  

## 简介 {#sec-intro}

除了[硬件中断](interrupts.html)，比如 HBlank 和卡带中断，还有所谓的<dfn>软件中断</dfn>，也叫<dfn>BIOS 调用</dfn>（SWI，软中断）。软件中断工作起来非常像普通函数：你设置输入、调用例程、取回一些输出。区别在于你如何到达代码；对普通函数，你只需，嗯，跳到你想要的例程。软件中断使用 `swi` 指令，它把程序流转移到 BIOS 中的某处，执行所请求的算法，然后恢复你程序的正常流。这类似于硬件中断所做的，只是现在你是编程式地触发中断。因此：软件中断。

GBA BIOS 有 42 个软件中断，带有用于复制、数学（除法、平方根）、精灵和背景的仿射变换、解压缩等的基本例程。还有一些非常特殊的函数，比如 `IntrWait` 例程，它可以停止 CPU 直到发生硬件中断。VBlank 变体被高度推荐，这正是本章重要的原因。

使用软件中断并不太难，如果不是因为一件事：`swi` 指令本身。这又需要一些汇编。不过，不需要*太多*汇编，而且很容易为它们写 C 包装器，我们在这里也会讲到。

## BIOS 函数 {#sec-funs}

调用 BIOS 函数可以通过 '`swi <i>n</i>`' 指令完成，其中 *n* 是你想用的 BIOS 调用。请注意，你需要使用的确切数字取决于你的代码处于 ARM 还是 Thumb 状态。在 Thumb 中参数就是 *n* 本身，但在 ARM 中你需要用 *n*<<16。就像普通函数一样，BIOS 调用可以有输入和输出。前四个寄存器（r0-r3）用于此目的；尽管每个调用的确切用途和寄存器数量不同。

这里有一份包含每个 BIOS 调用名字的列表。我不打算说它们各自做什么，因为其他站点已经做过了，照抄它们的东西似乎没意义。完整描述请看 [GBATEK](https://problemkaputt.de/gbatek.htm)，例如。我会描述其中几个，让你尝尝它们如何工作。

### 完整列表 {#ssec-funs-list}

<center>
<table class="center" width="70%">
<col span=5 align="left">
<tr><th>id		<th width="30%">Name  <th width="10%">	<th>id		<th>Name
<tr><td>0x00	<td>SoftReset		<td><td>0x08	<td>Sqrt
<tr><td>0x01	<td>RegisterRamReset<td><td>0x09	<td>ArcTan
<tr><td>0x02	<td>Halt			<td><td>0x0A	<td>ArcTan2
<tr><td>0x03	<td>Stop			<td><td>0x0B	<td>CPUSet
<tr><td>0x04	<td>IntrWait		<td><td>0x0C	<td>CPUFastSet
<tr><td>0x05	<td>VBlankIntrWait	<td><td>0x0D	<td>BiosChecksum
<tr><td>0x06	<td>Div				<td><td>0x0E	<td>BgAffineSet
<tr><td>0x07	<td>DivArm			<td><td>0x0F	<td>ObjAffineSet

<tr><td>&nbsp;
<tr><td>0x10	<td>BitUnPack		<td><td>0x18	<td>Diff16bitUnFilter
<tr><td>0x11	<td>LZ77UnCompWRAM	<td><td>0x19	<td>SoundBiasChange
<tr><td>0x12	<td>LZ77UnCompVRAM	<td><td>0x1A	<td>SoundDriverInit
<tr><td>0x13	<td>HuffUnComp		<td><td>0x1B	<td>SoundDriverMode
<tr><td>0x14	<td>RLUnCompWRAM	<td><td>0x1C	<td>SoundDriverMain
<tr><td>0x15	<td>RLUnCompVRAM	<td><td>0x1D	<td>SoundDriverVSync
<tr><td>0x16	<td>Diff8bitUnFilterWRAM	<td><td>0x1E <td>SoundChannelClear
<tr><td>0x17	<td>Diff8bitUnFilterVRAM	<td><td>0x1F <td>MIDIKey2Freq

<tr><td>&nbsp;
<tr><td>0x20	<td>MusicPlayerOpen		<td><td>0x28 <td>SoundDriverVSyncOff
<tr><td>0x21	<td>MusicPlayerStart	<td><td>0x29 <td>SoundDriverVSyncOn
<tr><td>0x22	<td>MusicPlayerStop		<td><td>0x2A <td>GetJumpList
<tr><td>0x23	<td>MusicPlayerContinue
<tr><td>0x24	<td>MusicPlayerFadeOut
<tr><td>0x25	<td>MultiBoot
<tr><td>0x26	<td>HardReset
<tr><td>0x27	<td>CustomHalt
</table>
</center>

### Div、Sqrt、Arctan2 与 ObjAffineSet 描述 {#ssec-funs-smpl}

<dl>
<dt>0x06: Div</dt>
<dd>
Input:
  <p>r0: 分子</p>
  <p>r1: 分母</p>
 Output:
  <p>r0: 分子 / 分母</p>
  <p>r1: 分子 % 分母</p>
  <p>r3: abs(分子 / 分母)</p>
 注意：不要除以零！
<br>
</dd>

<dt>0x08: Sqrt</dt>
<dd>
Input:
  <p>r0: num，一个无符号 32 位整数</p>
Output:
  <p>r1: sqrt(num)</p>
<br>
</dd>

<dt>0x0a: ArcTan2</dt>
<dd>
Input:
  <p>r0: <i>x</i>，一个<b>有符号 16 位</b>数（<code>s16</code>）</p>
  <p>r1: <i>y</i>，一个<b>有符号 16 位</b>数（<code>s16</code>）</p>
Output:
  <p>r0:
    <i>x</i>&ge;0 : <i>&theta;</i>= arctan(<i>y/x</i>) &or;
    <i>x</i>&lt;0 : <i>&theta;</i>=
      sign(<i>y</i>)*(&pi; &minus; arctan(|<i>y/x</i>|).<br>
  </p>
    这完成了 <i>y</i> = <i>x</i>*tan(&theta;) 的完全反函数。
    正切的问题在于其定义域是一个半圆，
    反正切的值域也是。要得到完整的圆周范围，不仅
    需要 <i>x</i> 和 <i>y</i> 值的商，还需要它们的符号。
    <i>&theta;</i> 的数学范围是 [&minus;&pi;,&nbsp;&pi;&rang;，对应于
    [&minus;0x8000,&nbsp;0x8000&rang;（或
    [0,&nbsp;2&pi;&rang; 和 [0,&nbsp;0xFFFF]，如果你乐意）
<br>
</dd>

<dt>0x0f: ObjAffineSet</dt>
<dd>
Input:
  <p>r0: 源地址</p>
  <p>r1: 目标地址</p>
  <p>r2: 计算次数</p>
  <p>r3: <b>P</b> 矩阵元素的偏移（背景为 2，
    对象为 8）</p>
</dd>
</dl>

源地址指向一个 `AFF_SRC` 结构体数组（也叫 `ObjAffineSource`，这有点误导，因为你也可以把它们用于背景）。`AFF_SRC` 结构体由两个缩放 *s*<sub>x</sub>、*s*<sub>y</sub> 和一个角度 α 组成，它再次使用范围 \[0, 0xFFFF\] 表示 2π。结果 **P**：

<math id="eq:pswi" xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtext mathvariant="bold">({!@eq:pswi})</mtext>
            <mtext>&#xA0;</mtext>
            <mtext>&#xA0;</mtext>
            <mtext mathvariant="bold">P</mtext>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">[</mo>
              <mtable columnspacing="1em" rowspacing="4pt">
                <mtr>
                  <mtd>
                    <msub>
                      <mi>s</mi>
                      <mi>x</mi>
                    </msub>
                    <mo>&#x22C5;</mo>
                    <mi>cos</mi>
                    <mo data-mjx-texclass="NONE">&#x2061;</mo>
                    <mi>&#x3B1;</mi>
                  </mtd>
                  <mtd>
                    <mo>&#x2212;</mo>
                    <msub>
                      <mi>s</mi>
                      <mi>x</mi>
                    </msub>
                    <mo>&#x22C5;</mo>
                    <mi>sin</mi>
                    <mo data-mjx-texclass="NONE">&#x2061;</mo>
                    <mi>&#x3B1;</mi>
                  </mtd>
                </mtr>
                <mtr>
                  <mtd>
                    <msub>
                      <mi>s</mi>
                      <mi>y</mi>
                    </msub>
                    <mo>&#x22C5;</mo>
                    <mi>sin</mi>
                    <mo data-mjx-texclass="NONE">&#x2061;</mo>
                    <mi>&#x3B1;</mi>
                  </mtd>
                  <mtd>
                    <msub>
                      <mi>s</mi>
                      <mi>y</mi>
                    </msub>
                    <mo>&#x22C5;</mo>
                    <mi>cos</mi>
                    <mo data-mjx-texclass="NONE">&#x2061;</mo>
                    <mi>&#x3B1;</mi>
                  </mtd>
                </mtr>
              </mtable>
              <mo data-mjx-texclass="CLOSE">]</mo>
            </mrow>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>

到现在你应该知道这做了什么：它水平缩放 1/*s*<sub>x</sub>，垂直缩放 1/*s*<sub>y</sub>，随后逆时针旋转 *α*。`ObjAffineSet()` 做的几乎和 `obj_aff_rotscale()` 与 `bg_aff_rotscale()` 一样，除了 `ObjAffineSet()` 还能一次设置多个矩阵。

源数据保存在 `ObjAffineSource`（即 `AFF_SRC`）结构体中。现在，由于这个例程设置仿射矩阵，你可能会认为目标是 `OBJ_AFFINE` 或 `ObjAffineDest` 结构体。然而，你会错。嗯，至少有一部分是。问题在于目标总是指向一个 *p*<sub>a</sub> 元素，它不一定是结构体的第一个元素。你*会*犯一个错误，就是简单地提供一个 `OBJ_AFFINE` 指针，当你试图用它来填充那些时。别说我没警告过你。

这里还有另外两件事要说。首先，我们再次有个名不副实的东西：ObjAffineSet 其实与对象本身没多大关系，但可以通过把 `r3` 设为 8 而非 2 来以那种身份使用。第二是这个例程也可以通过 `r2` 用于设置多个数组。然而，当你用 devkitPro 19 这样做时*要小心*。`ObjAffineSet()` 期望它的源结构体是[字对齐](bitmaps.html#ssec-data-align)的，而除非你自己加上对齐属性，它们不会是。

<pre><code class="language-c hljs">// Source struct. Note the alignment!
typedef struct AFF_SRC
{
    s16 sx, sy;
    u16 alpha;
} <span class="bold">ALIGN4</span> AFF_SRC, ObjAffineSource;

// Dst struct for background matrices
typedef struct Aff_DST
{
    s16 pa, pb;
    s16 pc, pd;
} ALIGN4 AFF_DST, ObjAffineDest;

// Dst struct for objects. Note that r1 should be
// the address of pa, not the start of the struct
typedef struct OBJ_AFFINE
{
    u16 fill0[3];    <span class="bold">s16 pa</span>;
    u16 fill1[3];    s16 pb;
    u16 fill2[3];    s16 pc;
    u16 fill3[3];    s16 pd;
} ALIGN4 OBJ_AFFINE;
</code></pre>

## 使用 BIOS 调用 {#sec-usage}

### 用于 BIOS 调用的汇编 {#ssec-use-swi-asm}

你可能认为整个讨论相当无意义，因为你无法访问寄存器与 `swi` 指令，除非你用汇编，那会相当难，对吧？嗯，不，是也不是。BIOS 调用所需的汇编步骤其实相当简单，如下给出。

```armasm
@ In tonc_bios.s

@ at top of your file
    .text           @ aka .section .text
    .code 16        @ aka .thumb

@ for each swi (like division, for example)
    .align 2        @ aka .balign 4
    .global Div
    .thumb_func
Div:
    swi     0x06
    bx      lr
```

这是 GNU 汇编器（GAS）的汇编代码；对于 Goldroad 或 ARM STD，语法可能略有不同。你需要做的第一件事是给一些<dfn>指令</dfn>，它们说明后续代码的一些细节。在本例中，我们用 '`.text`' 把代码放进 `text` 段（对于 multiboot 是 ROM 或 EWRAM）。我们还用 '`.code 16`' 或 '`.thumb`' 说代码是 Thumb 代码。如果你把它们放在文件顶部，它们对余下部分都有效。对于每个 BIOS 调用，你需要以下 6 项。

-   **字对齐**。或者至少是半字对齐，但字大概更可取。有两个指令用于此，<code>.align <i>n</i></code> 和 <code>.balign <i>m</i></code>。前者对齐到 2<sup>*n*</sup>，所以需要 '`.align 2`'；后者对齐到 *m*，所以你直接用 '`<code>balign <i>m</i></code>'。注意两者只作用于*下一段*代码或数据，不再往后，这就是为什么最好为每个函数都加上它。
-   **作用域**。`<code>.global <i>name</i></code>` 指令从 *name* 造出一个符号，它将也对项目中其他文件可见。有点像 `extern`，或者更确切地说，反-`static`。
-   **Thumb 指示符** 似乎 `.code 16` 单独不够，你还需要 `.thumb_func`。事实上，如果我读手册读得对，这一个也隐含了 `.code 16`，那会使那个指令多余。
-   **标签**。'*name*:' 标记符号 *name* 从哪里开始。显然，要用一个函数它必须确实存在。
-   **BIOS 调用** 要真正激活 BIOS 调用，用 'swi *n*'，*n* 为你想要的 BIOS 调用。
-   **返回** 而我们几乎已经完成了，现在要做的只是用 'bx lr' 返回调用者。

看到了吗？真的没那么复杂。有时你可能想要比这多一点功能，但大部分情况下你只需要两个不起眼的指令。

### ARM 架构过程调用标准 {#ssec-use-aapcs}

那一切都不错，但这仍然留下两个问题：a) 我怎么把它和 C 代码结合，b) 所有输入和输出去哪了？第一个的答案简单：就像平常一样加一个函数声明：

```c
// In tonc_bios.h

int Div(int num, int denom);
```

好的，但那*仍然*没解释我的输入和输出去哪了。嗯其实……它*有*。

> "我不确定云是如何形成的。但云知道怎么做，而那才是重要的事"

很久以前在某个"少儿科学"列表里找到这句引语，而我在编程时总会想起它。关于计算机的一点是它们不以输入、输出、文本、图片等来思考。实际上，它们根本不思考，但那是另一个故事了。计算机看到的只有数据；甚至不是代码和数据，只是数据，因为代码也是数据。当然，*你*可能不这么看，因为你习惯了 C 或 VB 或随便什么，但归根结底，全都只是 1 和 0。如果 1 和 0 通过程序计数器（**PC** 寄存器，`r15`）到达 CPU，那就是代码，否则就是数据。

那么这如何解释输入/输出？嗯，它不直接解释，但它指出了你该如何看待这个情况。试想你是编译器，你得把某人的 C 代码转换成 CPU 能实际使用的机器码（或汇编，那几乎是同一回事）。你碰到一行 "q= Div(x,y);"。`Div()` 做什么？嗯，如果 C 文件里没有那个名字的符号（确实没有，因为它在 *tonc_bios.s* 里），你不会知道。技术上，你甚至不知道它*是什么*。但 `Div` 知道，而那是重要的事。至少，那*几乎*是它工作的方式。编译器仍需要知道 `Div` 是哪种东西以避免混淆：变量？宏？函数？这正是声明的作用。而上面的声明说 `Div` 是一个期望两个有符号整数并返回一个的函数。就编译器而言，到此为止。
<br>  
当然，那仍然没解释编译器怎么知道该做什么。嗯，它只是遵循 *ARM 架构过程调用标准*，简称 <dfn>AAPCS</dfn>。它规定了函数之间应如何传递参数。这份 PDF 文档可以在[这里](https://github.com/ARM-software/abi-aa/releases/download/2023Q3/aapcs32.pdf) 找到，如果你打算搞汇编，很值得下载。

目前，你需要知道的是：前四个参数放在前四个寄存器 `r0-r3` 中，之后每个放在栈上。输出值放在 `r0` 中。只要你把 BIOS 调用的参数列表当作声明里的列表，它应该能正常工作。注意声明也负责任何需要做的类型转换。重要的是你要意识到这里的声明到底意味着什么：*它*决定函数如何被调用，而非实际的*定义*汇编函数。甚至 C 函数也不是。如果你搞错了声明，事情会出大错。

AAPCS 告诉你的另一件事是，寄存器 r0-r3（和 r12）是所谓的<dfn>临时</dfn>寄存器。这意味着调用者*预期*被调用函数会弄乱它们。函数返回后，它们的内容应被视为未定义——除非你就是那个同时写两个 asm 函数的人，那样可能会有些……通融。把这些作为临时寄存器意味着一个函数可以使用它们而无需把原值压栈和弹栈，从而节省时间。但这对其他寄存器不成立：r4-r11、r13、r14 *必须*以调用函数得到它们时的样子返回。最后一个，r15，免于这个要求，因为你不该乱动程序计数器。

### 内联汇编 {#ssec-use-inl-asm}

实际上，你甚至不需要一个完整的汇编文件来做 BIOS 调用：你可以用<dfn>内联汇编</dfn>。用内联汇编，你可以混合 C 代码和汇编代码。由于函数通常相当简单，你可以用类似这样的东西：

```c
// In a C file
int Div(int num, int denom)
{   asm("swi 0x06");   }
```

这做的和 `Div` 的汇编版本完全一样。然而，你需要小心内联汇编，因为你看不到它周围的代码，可能会意外地<dfn>破坏</dfn>一些你不该动的寄存器，从而毁掉其余代码。关于内联汇编的完整规则，见 [GCC 手册](http://www.gnu.org/manual/manual.html)。你也可以在 [devrs.com](http://www.devrs.com/gba/) 找到一个关于内联汇编使用的简短 faq。提醒你，内联汇编的"恰当"语法在世界上不是最友好的，而且还有别的问题。考虑上面给出的 C 函数。由于它本身其实什么都没做，优化器可能会想把它丢掉。这会在 `-O3` 下发生，除非你采取适当防范。而且，编译器会抱怨函数没有返回任何东西，即使它应该返回。它有道理，当然，考虑到那部分是在汇编块内处理的。可能还有几个我现在没意识到的其他问题；最终，用完整汇编版本更容易，因为你知道发生了什么。

### <kbd>swi_call</kbd> 宏 {#ssec-use-swi-call}

另一方面，也有不使用参数的 BIOS 调用，它们可以仅通过一个宏运行。`swi_call(x)` 宏会运行 BIOS 调用 *x*，它可以在 *swi.h* 中找到，也在 Wintermute 的 [libgba](https://devkitpro.org) 里，我正是从那里得到的。它比我上面给的 `Div` 函数稍精致一点。首先，它使用 `volatile` 关键字，应该能防止你的优化器删除这个函数（就像我们为所有寄存器做的那样）。其次，它使用了一个<dfn>破坏列表</dfn>（在三重冒号之后）。这会告诉编译器内联汇编用了哪些寄存器。第三，它会自动处理 Thumb/ARM 切换。如果你用 `-mthumb` 编译器选项，编译器会为我们定义 `__thumb__`，我们现在用它来得到正确的 swi 数字。聪明，是吧？

```c
#ifndef(__thumb__)
#define swi_call(x)   asm volatile("swi\t"#x ::: "r0", "r1", "r2", "r3")
#else
#define swi_call(x)   asm volatile("swi\t"#x"<<16" ::: "r0", "r1", "r2", "r3")
#endif
```



顺便说一句，如果你想要更多关于汇编的信息，你可以在 gbadev.org 找到一些 ARM 汇编的教程。另一个好方法是用 `-S` 编译器标志，它会给你一份编译器生成的、你代码的汇编文件。这会精确展示编译器对你的代码做了什么，包括优化步骤和 AAPCS 的使用。真的，你至少该看一次这个。

用 `-fverbose-asm` 也可能有帮助，它会把原始变量名和操作写在注释里。通常也在正确的位置。下面所示的 `ASM_CMT()` 宏也很方便。这会给你一些关于特定代码块在哪里的提示。但同样，不是所有时候。

```c
#define ASM_CMT(str) asm volatile("@ " str)

//In code. Outputs "@ Hi, I'm here!" in the generated asm
ASM_CMT("Hi, I'm here!");
```

## 演示图形 {#sec-demo}

<div class="cpt_fr" style="width:240px;">
<img alt="数学图形" src="./img/demo/swi_demo.png" id="fig:swi-demo">

**{*@fig:swi-demo}**: 除法、平方根、arctan2、正弦和余弦图形，由 BIOS 提供。
</div>

为了说明 BIOS 调用的使用，我用 Div、Sqrt、ArcTan 和 ObjAffineSet 来创建双曲线、平方根、正弦和余弦的图形。我缩放了它们，使它们能漂亮地适配 240x160 的屏幕。定义是

<table>
<tr><td>除法	<td><i>y</i>= 2560/<i>x</i>
<tr><td>平方根	<td><i>y</i>= 160*sqrt(<i>x</i>/240)
<tr><td>arctan  	<td><i>y</i>= 80 + 64*(2/&pi;)*(arctan(<i>x</i>-120)/16))
<tr><td>正弦		<td><i>y</i>=  1*sy*sin(2&pi;·<i>x</i>/240)	<td>; sy= 80
<tr><td>余弦		<td><i>y</i>= 80*sx*cos(2&pi;·<i>x</i>/240)	<td>; sx= 1
</table>

这些函数已经画在图 1 中。如果你在想正弦和余弦的值我是怎么得到的，既然没有那些调用，再看看等式 1。`P` 矩阵里有它们。我用 *p*<sub>a</sub> 表示余弦，*p*<sub>c</sub> 表示正弦。注意图形是瞬间出现的；图形绘制时没有任何加载时间的感觉。mode 7 演示（或 PERN 的 mode 7 演示）的早期版本用了调用实际的除法、正弦和余弦函数来构建 LUT。即使有三角学的对称规则，`sin()` 和 `cos()` 仍然明显比 BIOS 的等价物慢。

```c
#include <stdio.h>
#include <tonc.h>

// === swi calls ======================================================

// Their assembly equivalents can be found in tonc_bios.s

void VBlankIntrWait()
{   swi_call(0x05); }

int Div(int num, int denom)
{   swi_call(0x06); }

u32 Sqrt(u32 num)
{   swi_call(0x08); }

s16 ArcTan2(s16 x, s16 y)
{   swi_call(0x0a); }

void ObjAffineSet(const AFF_SRC *src, void *dst, int num, int offset)
{   swi_call(0x0f); }


// === swi demos ======================================================

// NOTE!
// To be consistent with general mathematical graphs, the
// y-axis has to be reversed and the origin moved to the
// either the bottom or mid of the screen via
// "iy = H - y"
// or
// "iy = H/2 - y"
//
// functions have been scaled to fit the graphs on the 240x160 screen

// y= 2560/x
void div_demo()
{
    int ix, y;

    for(ix=1; ix<SCREEN_WIDTH; ix++)
    {
        y= Div(0x0a000000, ix)>>16;
        if(y <= SCREEN_HEIGHT)
            m3_plot(ix, SCREEN_HEIGHT - y, CLR_RED);
    }
    tte_printf("#{P:168,132;ci:%d}div", CLR_RED);
}

// y= 160*sqrt(x/240)
void sqrt_demo()
{
    int ix, y;
    for(ix=0; ix<SCREEN_WIDTH; ix++)
    {
        y= Sqrt(Div(320*ix, 3));
        m3_plot(ix, SCREEN_HEIGHT - y, CLR_LIME);
    }
    tte_printf("#{P:160,8;ci:%d}sqrt", CLR_LIME);
}

// y = 80 + tan((x-120)/16) * (64)*2/pi
void arctan2_demo()
{
    int ix, y;
    int ww= SCREEN_WIDTH/2, hh= SCREEN_HEIGHT/2;
    for(ix=0; ix < SCREEN_WIDTH; ix++)
    {
        y= ArcTan2(0x10, ix-ww);
        m3_plot(ix, hh - y/256, CLR_MAG);
    }
    tte_printf("#{P:144,40;ci:%d}atan", CLR_MAG);
}

// wX= 1, wY= 80
// cc= 80*sx*cos(2*pi*alpha/240)
// ss=  1*sy*sin(2*pi*alpha/240)
void aff_demo()
{
    int ix, ss, cc;
    ObjAffineSource af_src= {0x0100, 0x5000, 0};    // sx=1, sy=80, alpha=0
    ObjAffineDest af_dest= {0x0100, 0, 0, 0x0100};  // =I (redundant)

    for(ix=0; ix<SCREEN_WIDTH; ix++)
    {
        ObjAffineSet(&af_src, &af_dest, 1, BG_AFF_OFS);
        cc= 80*af_dest.pa>>8;
        ss= af_dest.pc>>8;
        m3_plot(ix, 80 - cc, CLR_YELLOW);
        m3_plot(ix, 80 - ss, CLR_CYAN);
        // 0x010000/0xf0 = 0x0111.111...
        af_src.alpha += 0x0111;
    }

    tte_printf("#{P:48,38;ci:%d}cos", CLR_YELLOW);
    tte_printf("#{P:72,20;ci:%d}sin", CLR_CYAN);
}

// === main ===========================================================

int main()
{
    REG_DISPCNT= DCNT_MODE3 | DCNT_BG2;

    tte_init_bmp_default(3);
    tte_init_con();

    div_demo();
    sqrt_demo();
    aff_demo();

    arctan2_demo();

    while(1);

    return 0;
}
```

## 垂直同步 第二部分：VBlankIntrWait {#sec-vsync2}

直到现在，所有演示都用了 `vid_vsync` 函数来把动作同步到 VBlank（见[图形入门](video.html#sec-vsync1)）。它做的是检查 `REG_VCOUNT` 并停留在一个 while 循环里，直到下一个 VBlank 到来。虽然它工作，但就两件事而言它真是个相当糟糕的做法。首先，是因为你已经在 VBlank 中时潜在的问题，但那一个已经被涵盖了。第二个原因更重要：当你在 while 循环里时，你在浪费大量 CPU 周期，全部都在吞噬电池电量。

<div class="cpt_fr" style="width:240px;">
<img alt="swi_vsync" src="./img/demo/swi_vsync.png" id="fig:swi-vsync">

**{*@fig:swi-vsync}**: `swi_vsync` 演示。
</div>

有一些 BIOS 调用能把 CPU 置于低功耗模式，从而节省电池。这主要的 BIOS 调用是 Halt（#2），但我们目前感兴趣的是 VBlankIntrWait（#5）。它会设置好以等待直到下一个 VBlank 中断。要用它，你当然得把中断打开，特别是 VBlank 中断。像往常一样，VBlank 的 isr 将必须通过写入 `REG_IF` 来确认中断。但它*也*必须写入它的 BIOS 等价物，`REG_IFBIOS`。这点信息在别处有点难找（部分因为很少有教程覆盖 BIOS 调用）；更多信息见 [GBATEK, BIOS Halt Functions](https://problemkaputt.de/gbatek.htm#bioshaltfunctions)。对我们来说幸运的是，[中断](interrupts.html#sec-switch)一节中给出的交换板已经内置了这个。

为了展示如何设置它，请看 `swi_vsync` 演示。最重要的代码在下面给出；屏幕截图可以在图 2 找到。它做的是给一个旋转的 metroid 精灵，角速度为 π rad/s（这对应于 Δθ = 0x10000/4/60= 0x0111）。中断处理的基本步骤应该很熟悉，除了没有真正的 VBlank isr 这一事实，因为交换板已经负责确认中断了。在那之后就相当简单：我们用 `ObjAffineSet()` 计算所需的仿射矩阵，而 `VBlankIntrWait` 把 CPU 置于 Halt，直到下一个 VBlank 中断。

```c
// inside main, after basic initialisations

AFF_SRC as= { 0x0100, 0x0100, 0 };
OBJ_AFFINE oaff;

// enable isr switchboard and VBlank interrupt
irq_init(NULL);
irq_add(II_VBLANK, NULL);

while(1)
{
    VBlankIntrWait();

    // Full circle = 10000h
    // 10000h/4/60= 111h -> 1/4 rev/s = 1 passing corner/s
    as.alpha += 0x0111;
    ObjAffineSet(&as, &oaff.pa, 1, 8);

    obj_aff_copy(obj_aff_mem, &oaff, 1);
}
```

:::tip 优先用 VBlankIntrWait() 而非 vid_vsync()

通过 `vid_vsync()`（或其功能等价物）等待 VBlank 不是个好主意：它浪费太多电池电量。推荐的做法是用 `VBlankIntrWait()` 停止处理器，以便在 VBlank 中断时再次被唤醒。

:::

:::warning 确认 IntrWait 例程

`VBlankIntrWait()` 只是 BIOS 的 `IntrWait()` 例程之一，它能停止 CPU 直到中断被触发。然而，它不是看 `REG_IF` 而是看 `REG_IFBIOS`（0300:7FF8）来确认中断。如果你的游戏在尝试 `VBlankIntrWait()` 后卡住了，这可能就是原因。注意你可能会以其他名字找到这个地址，因为它其实没有官方的名字。

:::

## 最后的想法 {#sec-concs}

既然你知道怎么用它们了，我应该警告你不要太滥用它们。似乎 BIOS 例程是为空间而非速度设计的，所以它们不是世界上最快的。不仅如此，每个例程至少有 60 个周期的开销（请注意，普通函数似乎是 30 周期开销）。如果你追求速度，那么 BIOS 调用可能不是最好的东西；你大概能在网上……某处找到更快的例程。这当然不意味着 BIOS 例程没用，只是如果你有替代方法，就用那些。只要记住那是一个优化步骤，你不该过早做它。
