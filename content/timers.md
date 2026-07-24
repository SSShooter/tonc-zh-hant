# 15. 定时器

<!-- toc -->

## 时机就是一切 {#sec-intro}

回想一下，有多少次你听到一个笑话因为抖包袱太早或太晚而被毁掉；回想一下超级马里奥（或任何平台游戏）里所有那些失败的跳跃；回想一下在马里奥赛车起步时因为轰油门太早而打滑；你的无敌时间恰恰在红龟壳顶到你屁\[消音\]股之前消失；在老派射击游戏里，因为突然的卡顿而没能躲开那阵弹幕。想到这一切以及类似的场景，你就会同意：在游戏里，正如在生活中，时机就是一切。

讽刺的是，定时*器*（timers）反而没那么重要。纵观电子游戏历史，程序员们都是围绕一个计时机制来构建游戏的：屏幕的垂直刷新率。换句话说，就是 VBlank（垂直消隐）。这是一台面向机器的定时器（你按帧数计），而不是面向人的（那种你会按秒计）。对于主机来说，这非常好用，因为硬件总是相同的。（当然，除了有些国家用 NTSC 电视（@ 60 Hz），而另一些用 PAL 电视（@ 50 Hz）。生活在后者阵营且有条件接触两种电视的人都知道差别，并会诅咒一个事实：大多数游戏都源自 NTSC 国家。）虽然 VBlank 定时器无处不在，但它并非唯一。GBA 有 4 个时钟定时器供你使用。本节介绍这些定时器。

## GBA 定时器 {#sec-tmr}

所有能想得到定时器的工作方式都差不多。你有某个以固定频率振荡的东西（比如 CPU 时钟或钟摆的摆动）。每经过一个完整的周期，计数器就加一，你就有了一个定时器。很简单，不是吗？

GBA 定时器的基本频率是 CPU 频率，即 2<sup>24</sup> ≈ 16.78 MHz。换句话说，CPU 的一个<dfn>时钟周期</dfn>耗时 2<sup>−24</sup> ≈ 59.6 ns。由于这对我们人类来说是个非常糟糕的时间尺度，GBA 允许 4 种不同的频率（更准确说是周期）：1、64、256 和 1024 个周期。这些频率的一些细节见 {@tbl:tmr-freq}。通过巧妙地使用定时器寄存器，你实际上能创建任意频率的定时器，但稍后再详述。应当指出，屏幕恰好每 280,896 个周期刷新一次。

<div class="lblock">
<table id="tbl:tmr-freq" class="table-data">
<caption align="bottom">
  <b>{*@tbl:tmr-freq}</b>: 定时器频率
</caption>
<col span=4 align="right">
<tr><th>#cycles<th>frequency<th>period
<tr><td>  1 <td>16.78 MHz<td>59.59 ns
<tr><td>  64 <td>262.21 kHz<td>3.815 &mu;s
<tr><td> 256 <td>65.536 kHz<td>15.26 &mu;s
<tr><td>1024 <td>16.384 kHz<td>61.04 &mu;s
</table>
</div>

### 定时器寄存器 {#ssec-tmr-regs}

GBA 有 4 个定时器，定时器 0 到 3。每个定时器有两个寄存器：一个数据寄存器（`REG_TMxD`）和一个控制寄存器（`REG_TMxCNT`）。地址可以在 {@tbl:tmr-reg} 中找到。

<div class="lblock">
<table id="tbl:tmr-reg">
<caption align="bottom">
  <b>{*@tbl:tmr-reg}</b>: 定时器寄存器地址
</caption>
<tr><th>reg<th>function<th>address
<tr><td><code>REG_TMxD</code><td>data
	<td><code>0400:0100h  + 04h</code>·x
<tr><td><code>REG_TMxCNT</code><td>control
	<td><code>0400:0102h + 04h</code>·x
</table>
</div>

### REG_TMxCNT {#ssec-reg-tmxcnt}

<div class="reg">
<table class="table-reg" id="tbl:reg-tmxcnt">
<caption class="reg">
  REG_TMxCNT @ 0400:0102 + 4<i>x</i>
</caption>
<tr class="bits">
	<td>F E D C B A 9 8 <td>7 <td>6 <td>5 4 3 <td>2 <td>1 0
<tr class="bf">
  <td>-
  <td class="rclr0">En
  <td class="rclr1">I
  <td>-
  <td class="rclr3">CM
  <td class="rclr2">Fr
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width="12%">
<tr align="left"><th>bits<th>name<th>define<th>description
<tbody valign="top">
<tr class="bg0">
  <td>0-1<td class="rclr2">Fr
  <td>TM_FREQ_y
  <td>定时器<b>频率</b>。分别为 1、64、256 或 1024 个周期对应 0-3。</td>
    <code>y</code> 在该宏中是周期数。
<tr class="bg1">
  <td> 2 <td class="rclr3">CM
  <td>TM_CASCADE
  <td><b>级联模式</b>。当<b>前一个</b>（<code>x</code>&minus;1）定时器溢出（<code>REG_TM(x-1)D= 
    0xffff</code>）时，本定时器也会加一。设置了此位的定时器并<b>不</b>自行计数，不过你仍然需要把它使能。显然，这对于定时器 0 无效。如果你打算用它，请确保你完全理解我刚才说的；此地对疏忽者是个死亡陷阱。
<tr class="bg0">
  <td> 6 <td class="rclr1">I
  <td>TM_IRQ
  <td>溢出时触发中断。
<tr class="bg1">
  <td> 7 <td class="rclr0">En
  <td>TM_ENABLE
  <td>使能定时器。
</tbody>
</table>
</div>

### REG_TMxD {#ssec-reg-tmxd}

数据寄存器 `REG_TMxD` 是一个 16 位数字，它的工作方式与你一开始预期的略有不同，但归根结底它是有道理的。你从寄存器**读**出的值是**当前**的定时器计数值。到目前为止，一切正常。然而，你**写**入 `REG_TMxD` 的值，是计数器在定时器被使能（通过 `TM_ENABLE`）或溢出时开始计数的**初始值**。这有几个"有趣"的后果。为了便于说明，定义变量 *n* 为初始值（写入数），*c* 为当前计数值（读出数）。
<br>  
首先，当你像这样设置一个 *n*（比如 `c000h`）：

```c
    REG_TM2D= 0xc000;
```

你*并没有*把当前定时器计数值 *c* 设为 *n*（=`c000h`）。事实上，如果定时器被禁用，那么 *c*= 0。然而，一旦你使能计数器，那么 *c = n* 并从此处继续。而且当定时器溢出时，它也会重置为该值。顺便说一句，由于 *n* 只是起始值，先设置 *n*、再使能定时器很重要。

其次，问问你自己：当你再次禁用定时器时会发生什么？嗯，计数器保留其当前值。然而，当你随后**使能**它时，*c* 会再次重置为 *n*。如果你想要禁用定时器一段时间（比如游戏暂停时），然后再从它停下的地方继续，这就有点烦人了。嗯，是的，但有办法实现它。怎么做？通过设置 `TM_CASCADE` 把它变成一个级联定时器！在 `REG_TMxCNT` 中设置该位会使定时器仅在前一个定时器溢出时才增加。如果你阻止这种情况发生（比如禁用它），那么你实际上就禁用了你的定时器。

最后，给定某个 *n*，定时器将在 *T*= `10000h`−*n* 次递增后溢出。或者，多亏了补码的美妙，直接就是 *T*= −*n*。配合级联定时器（或中断），你可以构建任意频率的定时器，这正是你想要的定时器。

:::warning 写入 REG_TMxD 的方式很怪

写入 REG_TMxD 可能并不像你想的那样。它并*不*设置定时器的值。相反，它设置的是下一次定时器运行的*初始*值。

:::

## 定时器演示：像钟表一样 {#sec-demo}

在今天的演示中，我将展示如何用定时器做一个简单的数字时钟。为此，我们需要一个 1 Hz 的定时器。由于它不能直接得到，我将用定时器 2 和 3 搭建一个级联定时器系统。定时器 3 会被设为级联模式，在定时器 2 溢出时更新。这样就能让溢出恰好以一赫兹的频率发生。时钟频率是 2<sup>24</sup>，也就是 1024\*0x4000。通过将定时器 2 设为 `TM_FREQ_1024` 并从 −0x4000 开始，级联的定时器 3 实际上就成了一个 1 Hz 计数器。

<div class="cpt_fr" style="width:240px;">
<img alt="时钟演示" src="./img/demo/tmr_demo.png" id="fig:tmr-demo">

**{*@fig:tmr-demo}**: `tmr_demo`。
</div>

每当定时器 3 更新时，演示就把秒数转换为时、分、秒并打印在屏幕上（见 {@fig:tmr-demo}）。是的，我在这里用了除法和取模，因为这是最简单的做法，而且在这个特定演示里我消耗得起这些周期。

演示可以用 Select 和 Start 来（取消）暂停。Start 禁用定时器 2，从而也禁用了定时器 3。Select 把定时器 2 也变成一个级联定时器，而由于定时器 1 是禁用的，这样做也会停止定时器 2（和 3）。区别在于你取消暂停时会发生什么。通过禁用一个定时器，它会从初始值重新开始；但用级联停止它实际上让定时器保持活动，一旦级联被移除它就会简单地继续计数。差别很微妙，但后者更合适。

```c
// Using a the "Berk" font from headspins font collection.

#include <stdio.h>
#include <tonc.h>
#include "berk.h"

void tmr_test()
{
    // Overflow every ~1 second:
    // 0x4000 ticks @ FREQ_1024

    REG_TM2D= -0x4000;          // 0x4000 ticks till overflow
    REG_TM2CNT= TM_FREQ_1024;   // we're using the 1024 cycle timer

    // cascade into tm3
    REG_TM3CNT= TM_ENABLE | TM_CASCADE;

    u32 sec= -1;

    while(1)
    {
        vid_vsync();
        key_poll();

        if(REG_TM3D != sec)
        {
            sec= REG_TM3D;
            tte_printf("#{es;P:24,60}%02d:%02d:%02d", 
                sec/3600, (sec%3600)/60, sec%60);
        }

        if(key_hit(KEY_START))  // pause by disabling timer
            REG_TM2CNT ^= TM_ENABLE;

        if(key_hit(KEY_SELECT)) // pause by enabling cascade
            REG_TM2CNT ^= TM_CASCADE;
    }
}

int main()
{
    // set-up berk font
    tte_init_se(0, BG_CBB(0)|BG_SBB(31), 1, 0, 0, &berkFont, se_drawg);
    tte_init_con();
    memcpy16(pal_bg_mem, berkPal, berkPalLen/4);

    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0;

    tmr_test();

    return 0;
}
```

这只是定时器相当简单的一种用法。当然，我本可以同样轻易地用 VBlank 来记录秒数，而这本来就是通常的做法。硬件定时器通常保留给定时的 DMA 使用，定时的 DMA 用于[声音混音器](https://stuij.github.io/deku-sound-tutorial/g)，而非用于游戏定时器。不过还有一个能想到的用途，即性能剖析：检查你的函数有多快。其中一个[文本系统演示](text.html#ssec-demo-se2)就是用它来检测几个复制例程的速度。
