# 14. 直接内存访问

<!-- toc -->

## DMA … 是什么？ {#sec-intro}

<dfn>直接内存访问</dfn>（DMA，Direct Memory Access）是一种把数据从一处快速复制到另一处的方法。或者更准确地说，是一种*快速传输*数据的方法；因为它既可用于复制数据，也可用于填充内存。当你激活 DMA 时，所谓的 <dfn>DMA 控制器</dfn>会接管硬件（CPU 实际上被挂起），完成所需的传输，并在你还没意识到它消失之前把控制权交还 CPU。

一共有四个 DMA 通道。通道 0 优先级最高；它用于时间关键的操作，且只能配合内部 RAM 使用。通道 1 和 2 用于把声音数据传到正确的声音缓冲区以供播放。优先级最低的通道 3 用于通用复制。这个通道的主要用途之一是载入新的位图或图块数据。

## DMA 寄存器 {#sec-regs}

每种传输例程都需要 3 样东西：源、目标，以及要复制的数据量。即*从哪来*、*到哪去*和*多少*。对于 DMA，源地址被放入 `REG_DMAxSAD`，目标地址放入 `REG_DMAxDAD`。第三个寄存器 `REG_DMAxCNT` 不仅指示要传输的数量，还控制 DMA 可能的其他特性，比如何时开始传输、块大小，以及源和目标地址在每一块数据传输后应如何更新。所有 DMA 寄存器都是 32 位长，不过如果需要，它们也可以分成两半作为两个 16 位寄存器。通道 0 的寄存器从 `0400:00B0h` 开始；后续通道以 12 的偏移开始（见 {@tbl:dma-regs}）。

<div class="lblock">
<table id="tbl:dma-regs">
<caption align="bottom">
  <b>{*@tbl:dma-regs}</b>: DMA 寄存器地址
</caption>
<tr><th>reg<th>function<th>address
<tr><td><code>REG_DMAxSAD</code><td>source
	<td><code>0400:00B0h  + 0Ch</code>·x
<tr><td><code>REG_DMAxDAD</code><td>destination
	<td><code>0400:00B4h + 0Ch</code>·x
<tr><td><code>REG_DMAxCNT</code><td>control
	<td><code>0400:00B8h + 0Ch</code>·x
</table>
</div>

### DMA 控制寄存器 {#ssec-reg-cnt}

源和目标寄存器的用法应该一目了然。控制寄存器则需要一些解释。虽然 `REG_DMAxCNT` 寄存器本身是 32 位，但它们常被拆成两个独立的寄存器：一个用于计数，一个用于实际的控制位。

<div class="reg">
<table class="table-reg reg-huge" id="tbl:reg-dmaxcnt"
  border=1 frame=void cellPadding=4 cellSpacing=0>
<caption class="reg">
  REG_DMAxCNT @ 0400:00B8+12<i>x</i>
</caption>
<tr class="bits">
	<td>1F<td>1E<td>1D 1C<td>1B<td>1A<td>19<td>18 17
	<td>16 15<td>14 13 12 11 10
	<td>F E D C B A 9 8 7 6 5 4 3 2 1 0
<tr class="bf">
  <td class="rclr1">En
  <td class="rclr6">I
  <td class="rclr5">TM
  <td>-
  <td class="rclr2">CS
  <td class="rclr7">R
  <td class="rclr3">SA
  <td class="rclr4">DA
  <td>-
  <td class="rclr0">N
</table>
<br>

<table class="table-reg-vert">
  <col class="bits" width=56>
  <col class="bf" width="8%">
  <col class="def" width="12%">
<tr align="left"><th>bits<th>name<th>define<th>description
<tbody valign="top">
<tr class="bg0">
  <td>00-0F<td class="rclr0">N
  <td> 
  <td><b>传输</b>次数。
<tr class="bg1">
  <td>15-16<td class="rclr4">DA
  <td>DMA_DST_INC, DMA_DST_DEC, DMA_DST_FIXED, DMA_DST_RELOAD
  <td><b>目标地址调整</b>。
    <ul>
      <li><b>00</b>: 每次传输后递增（默认）
      <li><b>01</b>: 每次传输后递减
      <li><b>10</b>: 不变；地址固定
      <li><b>11</b>: 在传输过程中递增目标地址，并重置它，使重复 DMA 总能从同一个目标地址开始。
    </ul>
<tr class="bg0">
  <td>17-18<td class="rclr3">SA
  <td>DMA_SRC_INC, DMA_SRC_DEC, DMA_SRC_FIXED,
  <td><b>源地址调整</b>。工作方式与目标的那两位一样。注意没有 <code>DMA_SRC_RESET</code>；源的编码 3 是被禁止的。
<tr class="bg1">
  <td> 19  <td class="rclr7">R
  <td>DMA_REPEAT
  <td>如果 DMA 时序被设为那些模式，会在每个 VBlank 或 HBlank 重复复制。
<tr class="bg0">
  <td> 1A  <td class="rclr2">CS
  <td>DMA_16, DMA_32
  <td><b>块大小</b>。设置 DMA 每次复制半字（清除时）或字（置位时）。
<tr class="bg1">
  <td>1C-1D<td class="rclr5">TM
  <td>DMA_NOW, DMA_AT_VBLANK, DMA_AT_HBLANK, DMA_AT_REFRESH
  <td><b>时序模式</b>。指定传输应在何时开始。
      <ul>
        <li><b>00</b>: 立即开始。
        <li><b>01</b>: 在 VBlank 开始。
        <li><b>10</b>: 在 HBlank 开始。
        <li><b>11</b>: 迄今从未用过，但据我了解它这样工作。对于 DMA1 和 DMA2，它会在 FIFO 被清空时重新填充。计数和大小分别被强制为 1 和 32 位。对于 DMA3，它会在每条渲染线开始时启动复制，但有 2 条扫描线的延迟。
      </ul>
<tr class="bg0">
  <td> 1E  <td class="rclr6">I
  <td>DMA_IRQ
  <td><b>中断请求</b>。完成时触发中断。
<tr class="bg1">
  <td> 1F  <td class="rclr1">En
  <td>DMA_ENABLE
  <td><b>使能</b>该通道的 DMA 传输。
</tbody>
</table>
</div>

### 源地址与目标地址 {#ssec-reg-adr}

源和目标地址寄存器的用法正如你所预期：只要放入正确的地址即可。哦，我应该告诉你，源和目标地址的大小分别是 28 位和 27 位宽，而非完整的 32 位。不过这没什么好担心的，反正你也访问不到 `1000:0000h` 以上的地址。对于目标地址，你不能使用 `0800:0000h` 以上的区域。但是话说回来，能复制到 ROM 也挺奇怪的，不是吗？

### DMA 标志位 {#ssec-reg-flags}

`REG_DMAxCNT` 寄存器可以分成两部分：一部分带实际标志位，一部分用于要执行的复制次数。两种方式都行，但你必须小心标志位是如何定义的：把 32 位的 #define 用于 16 位寄存器，或者反过来，都不是好主意。

有一些选项可以控制一块数据传输完后，下一个源和目标地址是什么。默认情况下，两者都会递增，这样它就作为复制器工作。但你也可以让源保持恒定，这样它就更像内存填充了。

放入 `REG_DMAxCNT` 低半字的是传输次数。这是*块*的数量，而非字节数！在这里用 `sizeof()` 或类似的东西时要格外小心，漏掉一个 2 或 4 的因子非常容易。一块可以是 16 位或 32 位，取决于第 26 位。

### 更多关于 DMA 时序 {#ssec-reg-timing}

立即 DMA 做什么很好想象，你一使能 DMA 它就开始工作。嗯，*实际上*它要花 2 个周期才会真正生效，但也足够接近了。其他时序设置概念上并不更难，但有一点容易令人困惑。

考虑以下情形：你想对你那本来很标准的背景做些很酷的事；具体来说，你想做一件需要每一条扫描线都更新背景寄存器的事。我刚才说过你可以在每个 HBlank 复制数据（通过 `DMA_AT_HBLANK` 时序标志），这看起来完美契合这项工作。不过，如果你想一想，可能会问自己下面这个问题：

> 当你把时序设为比如 `DMA_AT_HBLANK` 时，它会在下一个 HBlank 做*全部* *N* 次复制，还是每个 HBlank 做一次复制直到列表做完？

两者之间有关键区别。第一种选择似乎毫无意义，因为所有复制都会一次性完成；如果目标地址是固定的（背景寄存器就是这样），那么除了最后一次之外的所有复制都会丢失。在第二种情况下，你又如何在每个 HBlank 做不止一次复制呢？显然，这里有什么不对劲。而且不对劲的地方有两处。

郑重声明，我并不完全确定我下面要说的，但我认为它相当接近实际发生的情况。要认识到的主要一点是：只要通道未被使能（`REG_DMAxCNT`\{1f\} 被清除），那个通道就不会做任何事；只有在 `REG_DMAxCNT`\{1f\} 被置位后，DMA 过程才会启动。在恰当的时机（由时序位决定），DMA 会完成全部 *N* 次复制，然后再次自行关闭。

除非，也就是说，重复位（`REG_DMAxCNT`\{19\}）被置位。那样的话，它会在恰当的时机不断做复制，直到你亲自禁用该通道。

## 一些 DMA 例程 {#sec-func}

虽然手动设置三个寄存器不算太麻烦，但把直接交互隐藏在子例程中更好。现在，在较老的代码中，你可能会遇到类似这样的东西：

```c
// Don't do this. Please.
void dma_copy(int ch, void* src, void* dest, uint count, u32 mode)
{
    switch(ch)
    {
    case 0:
        // set DMA 0
    case 1:
        // set DMA 1
... // etc
    }
}
```

这能工作，但不是个漂亮的做法。如果你的 switch-case 只差一个数字，通常可以用一个简单的查表来替代。有若干种方式修复这个，但最简单的是把一个结构体数组映射到 DMA 寄存器上，类似于我对图块内存做的那样。之后，你只需用通道变量选择通道，然后填入地址和标志即可。

```c
typedef struct DMA_REC
{
    const void *src;
    void *dst;
    u32 cnt;
} DMA_REC;

#define REG_DMA ((volatile DMA_REC*)0x040000B0)
```

下面是我三个 DMA 例程中的三个。首先是 `DMA_TRANSER()` 宏，它是可用于任何情况的通用宏。然后是两个用 DMA 3 进行 32 位传输、用于通用内存复制和填充的例程。

```c
// in tonc_core.h

//! General DMA transfer macro
#define DMA_TRANSFER(_dst, _src, count, ch, mode)   \
do {                                            \
    REG_DMA[ch].cnt= 0;                         \
    REG_DMA[ch].src= (const void*)(_src);       \
    REG_DMA[ch].dst= (void*)(_dst);             \
    REG_DMA[ch].cnt= (count) | (mode);          \
} while(0)

//! General DMA copier
INLINE void dma_cpy(void *dst, const void *src, uint count, int ch, u32 mode)
{
    REG_DMA[3].cnt = 0; // shut off any previous transfer
    REG_DMA[3].src = src;
    REG_DMA[3].dst = dst;
    REG_DMA[3].cnt = count;
}

//! General DMA full routine
INLINE void dma_fill(void *dst, volatile u32 src, uint count, int ch, u32 mode)
{
    REG_DMA[3].cnt = 0; // shut off any previous transfer
    REG_DMA[3].src = (const void*)&src;
    REG_DMA[3].dst = dst;
    REG_DMA[3].cnt = count | DMA_SRC_FIXED;
}

//! Word copy using DMA 3
INLINE void dma3_cpy(void *dst, const void *src, u32 size)
{   dma_cpy(dst, src, size/4, 3, DMA_CPY32);  }

//! Word fill using DMA 3
INLINE void dma3_fill(void *dst, const void *src, u32 size)
{   dma_fill(dst, src, size/4, 3, DMA_CPY32);  }
```

在所有情况下，我都会先禁止任何之前正在运行的传输。虽然 DMA 会停止 CPU，这看似多余，但请记住 DMA 传输也可能是定时的——你可不想让它在你设置寄存器到一半时就开始。在那之后，就只是填充寄存器的事了。现在，碰巧任何传输真正开始前都有 2 个周期的延迟。这意味着如果你紧接着请求传输，可能会丢一次传输。不过我不确定这很可能发生：内存等待状态本身就已经花那么多时间了，所以你*应该*是安全的。

关于这些例程的其他说明：`DMA_TRANSFER()` 宏的代码夹在一个 `do {} while(0);` 循环里。宏的问题在于，展开后多条语句可能会破坏嵌套块。例如，在 `if` 的主体中不带花括号地调用它，会让第一行成为主体，而其余行落在主体之外。这种循环是防止这种情况的方式之一。宏的另一个问题是，参数的名字可能会隐藏宏代码的其他部分。比如 `DMA_REC` 结构体的 `src` 和 `dst` 成员；这也是为什么它们加了下划线。填充例程还发生了一些值得注意的事，你可以在[下一小节](#ssec-func-fill)读到。最后，`dma3` 内联函数使用字传输，并把字节大小作为最后一个参数，使它们非常类似于标准的 `memcpy()` 和 `memset()`。
<br>  
我以前有过下面这个用于传输的宏。它使用了预处理器的一种更奇特的能力：合并运算符 '##'，它让你能在编译时创建符号名。它吓人、完全不安全、而且通常难以驾驭，但它确实能用。我给的另一个宏更好，但我仍然喜欢这个东西。

```c
#define DMA_TRANSFER(_dst, _src, _count, _ch, _mode)  \
    REG_DMA##_ch##SAD = (u32)(_src),                  \
    REG_DMA##_ch##DAD = (u32)(_dst),                  \
    REG_DMA##_ch##CNT = (_count) | (_mode)            \
```

只要你对 `_ch` 使用一个字面量数字，它就会形成正确的寄存器名。而且是的，语句之间的那些逗号运算符确实能工作。它们让语句彼此独立，也和 `do{} while(0)` 结构一样防止了错误的嵌套。

### 关于 DMA 填充 {#ssec-func-fill}

DMA 可用于填充内存，但在你尝试之前，有两个问题需要注意。第一个只要留心就能避免。DMA 填充的工作方式*并不*完全和 `memset()` 一样。你放入 `REG_DMAxSAD` 的不是你要用来填充的值，而是它的*地址*！

"很好，我把值放进一个变量，用它的地址。"是的，而这把我们带到第二个问题，一个几乎不可能找到的 bug。如果你这样做，你会发现它不工作。嗯，它确实填充了*某种东西*，但通常不是你想填充的东西。完整的解释有点技术化，但基本上是因为你可能只用了变量的地址而非它的*值*，优化器就从未初始化它。有一个简单的解决方案，一个我们之前见过的：把它设为 volatile。或者你可以用像 `dma_fill()` 这样的（内联）函数，它的源参数被设为 volatile，所以你可以像预期那样直接插入一个数字。注意如果你去掉那里的 volatile 关键字，它会再次失败。
<br>  
简而言之：DMA 填充需要地址，而非直接的值。全局变量永远有效，但如果你用局部变量或参数，你需要把它们设为 volatile。注意同样的情况也适用于 BIOS 调用 CpuFastSet()。

### DMA：别用过头 {#ssec-func-use}

DMA 很快，这毫无疑问。它最高可以比数组复制[快十倍](text.html#ssec-demo-se2)。然而，要考虑两次再决定是否把 DMA 用于每一次复制。虽然它快，但也并非完胜其他所有传输例程。CpuFastSet() 在复制上能接近它 10% 以内，而在填充上实际上快 10%。速度上的收益没那么大。另一个问题是它会停止 CPU，这可能搞乱[中断](interrupts.html)，造成看似随机的 bug。它确实有特定用途，通常与定时器或中断配合使用，但对于通用复制，你也可以考虑其他东西。CpuFastSet() 是个好例程，但 libtonc 还附带了 `memcpy16()/32()` 和 `memset16()/32()` 例程，它们比它更安全，限制也更少。不过它们是汇编例程，所以你需要知道如何汇编或使用库。

## DMA 演示：圆形窗口 {#sec-demo}

<div class="cpt_fr" style="width:240px;">
<img alt="dma_demo 简图" src="./img/demo/dma_demo.png" id="fig:dma-demo">

**{*@fig:dma-demo}**: `dma_demo` 的调色板。
</div>

本章的演示可能看起来有点复杂，但效果是值得的。DMA 传输的基本用法太简单了，几乎不值得专门做个演示。而*触发式* DMA 则是另一回事。在这种情况下，我们来看 HBlank 触发的 DMA，简称 HDMA。我们将用它来更新[HBlank 内调整大小](gfx.html#sec-win)的[窗口](gfx.html#sec-win)，以实现圆形窗口效果。

这当然说起来容易做起来难。设计的第一步是，首先怎样才能把 HDMA 用于此。因为我们需要在每个 HBlank 复制到 `REG_WIN0H`，我们需要让目标地址固定。严格来说，它需要*重置*为原始目标地址，但由于只复制一个半字，这意味着同样的事。对于源，我们会在一个数组中跟踪需要复制到那里、每条扫描线对应一项的数据，并每次推进数组一条扫描线（即，递增源）。当然，传输必须在*每条*扫描线发生，所以我们把它设为重复。所以基本上我们需要这个：

```c
#define DMA_HDMA    (DMA_ENABLE | DMA_REPEAT | DMA_AT_HBLANK | DMA_DST_RELOAD)
```

至于圆，我们需要一个能计算圆的左边缘和右边缘的例程。周围有几种能画圆的算法，比如 [Bresenham 的](http://www.gamedev.net/reference/articles/article767.asp) 版本。我们将使用它的修改版，因为我们只需要存储左右点，而不是在那里画一个像素。为何是左右而非上下？因为数组是基于扫描线的，所以那已经表明了 *y* 值。

你实际用什么并不重要，只要你能找到边缘。一旦找到，你只需在 VBlank 中设置好 DMA 就完成了。
<br>  
最终结果会显示像 {@fig:dma-demo} 那样的东西。是窗口内的 Brinstar 背景（又是它），以及外面的条纹背景。文字标明了窗口的位置和半径，可以用十字键移动，并用 A 和 B 缩放。

<pre><code class="language-c hljs">
#include <stdio.h>
#include <tonc.h>

#include "brin.h"

// From tonc_math.h
//#define IN_RANGE(x, min, max) ( (x) >= (min) && (x) < (max) )


// The source array
<span class="bold">u16 g_winh[SCREEN_HEIGHT+1];</span>

//! Create an array of horizontal offsets for a circular window.
/*! The offsets are to be copied to REG_WINxH each HBlank, either
*     by HDMA or HBlank isr. Offsets provided by modified
*     Bresenham's circle routine (of course); the clipping code is not
*     optional.
*   \param winh Pointer to array to receive the offsets.
*   \param x0   X-coord of circle origin.
*   \param y0   Y-coord of circle origin.
*   \param rr   Circle radius.
*/
void win_circle(u16 winh[], int x0, int y0, int rr)
{
    int x=0, y= rr, d= 1-rr;
    u32 tmp;

    // clear the whole array first.
    memset16(winh, 0, SCREEN_HEIGHT+1);

    while(y >= x)
    {
        // Side octs
        tmp  = clamp(x0+y, 0, SCREEN_WIDTH);
        tmp += clamp(x0-y, 0, SCREEN_WIDTH)<<8;

        if(IN_RANGE(y0-x, 0, SCREEN_HEIGHT))       // o4, o7
            winh[y0-x]= tmp;
        if(IN_RANGE(y0+x, 0, SCREEN_HEIGHT))       // o0, o3
            winh[y0+x]= tmp;

        // Change in y: top/bottom octs
        if(d >= 0)
        {
            tmp  = clamp(x0+x, 0, SCREEN_WIDTH);
            tmp += clamp(x0-x, 0, SCREEN_WIDTH)<<8;

            if(IN_RANGE(y0-y, 0, SCREEN_HEIGHT))   // o5, o6
                winh[y0-y]= tmp;
            if(IN_RANGE(y0+y, 0, SCREEN_HEIGHT))   // o1, o2
                winh[y0+y]= tmp;

            d -= 2*(--y);
        }
        d += 2*(x++)+3;
    }
    winh[SCREEN_HEIGHT]= winh[0];
}

void init_main()
{
    // Init BG 2 (basic bg)
    <span class="bold">dma3_cpy(pal_bg_mem, brinPal, brinPalLen);</span>
    dma3_cpy(tile_mem[0], brinTiles, brinTilesLen);
    dma3_cpy(se_mem[30], brinMap, brinMapLen);

    REG_BG2CNT= BG_CBB(0)|BG_SBB(30);

    // Init BG 1 (mask)
    const TILE tile=
    {{
        0xF2F3F2F3, 0x3F2F3F2F, 0xF3F2F3F2, 0x2F3F2F3F,
        0xF2F3F2F3, 0x3F2F3F2F, 0xF3F2F3F2, 0x2F3F2F3F
    }};
    tile_mem[0][32]= tile;
    pal_bg_bank[4][ 2]= RGB15(12,12,12);
    pal_bg_bank[4][ 3]= RGB15( 8, 8, 8);
    pal_bg_bank[4][15]= RGB15( 0, 0, 0);
    se_fill(se_mem[29], 0x4020);

    REG_BG1CNT= BG_CBB(0)|BG_SBB(29);

    tte_init_chr4_b4_default(0, BG_CBB(2)|BG_SBB(28));
    tte_init_con();
    tte_set_margins(8, 8, 232, 40);

    // Init window
    REG_WIN0H= SCREEN_WIDTH;
    REG_WIN0V= SCREEN_HEIGHT;

    // Enable stuff
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0 | DCNT_BG1 | DCNT_BG2 | DCNT_WIN0;
    REG_WININ= WIN_BUILD(WIN_BG0|WIN_BG2, 0);
    REG_WINOUT= WIN_BUILD(WIN_BG0|WIN_BG1, 0);
}

int main()
{
    int rr=40, x0=128, y0=120;

    init_main();

    while(1)
    {
        vid_vsync();
        key_poll();

        rr += key_tri_shoulder();   // size with B/A
        x0 += key_tri_horz();       // move left/right
        y0 += key_tri_vert();       // move up/down

        if(rr<0)
            rr= 0;

        // Fill circle array
        <span class="bold">win_circle(g_winh, x0, y0, rr);</span>

        // Init win-circle HDMA
        <span class="bold">DMA_TRANSFER(&REG_WIN0H, &g_winh[1], 1, 3, DMA_HDMA);</span>

        tte_printf("#{es;P}(%d,%d) | %d", x0, y0, rr);
    }

    return 0;
}
</code></pre>

初始化函数大部分只是些点缀。说大部分，是因为有一件有趣的事：调用 `dma_cpy` 来复制 Brinstar 的调色板、图块和地图。除此之外，这里没什么好看的。

主函数本身也相当标准。这里有趣的是调用 `win_circle()`（设置源数组）和 `DMA_TRANSFER()`（初始化 HDMA）。注意我其实是让它从 `g_winh[1]` 而不是 `g_winh[0]` 开始。原因是 HBlank 发生在给定扫描线*之后*，而非之前，否则我们会滞后一个。这个 `g_winh` 数组实际上长 160+1，第 0 项和第 160 项都描述扫描线 0 的数据。还有一点重要但此处不太看得出的是：HDMA 只发生在*可见*的 HBlank 上，而非 VBlank 中的那些。这省去了在确定设置时要为多少个扫描线做修正的一大堆麻烦。

然后就是 `win_circle()`。如果你知道 Bresenham 画圆算法如何工作，你会知道它计算一个八分圆的偏移，然后通过对称规则把它用于其他 7 个八分圆。这里也一样。原版里大概没做的，是所有的裁剪（`clamp()` 和 `IN_RANGE()`）。然而，这些步骤在这里绝对至关重要。水平越界意味着错误的窗口偏移，会让窗口向内卷。垂直越界意味着 `g_winh` 越界，招致各种可怕后果。相信我，它们是必需的。

另外，注意我先清掉了整个数组；这可以在循环内做，但有时先填整个数组、然后只更新需要的部分反而更快。最后，如前所述，第一条扫描线的数据被复制到数组的最后一项，以应对 HBlank 发生的方式。
<br>  
DMA 这一章到此结束。以这种方式使用 HDMA 对各种效果都很棒，不只是圆形窗口。你只需要一个包含扫描线数据的数组，以及一个事先设置它的函数。不过小心别把你的通道搞混了。

DMA 是最快的复制方法，但由于它会阻塞中断，使用 `memcpy32()` 可能更安全。反正速度差异只有 10%。DMA 也用于声音 FIFO，配合定时器使用。我没法真正展示如何用 DMA 做声音，但我可以告诉你定时器如何工作，下一章就会讲。
