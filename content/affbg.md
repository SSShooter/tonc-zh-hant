# 12. 仿射背景

<!-- toc -->

## 简介 {#sec-intro}

本节讲解<dfn>仿射背景</dfn>：也就是你可以通过 **P** 矩阵施加仿射变换的那些背景。而它也就仅此而已。如果你还没读——并且理解！——[精灵/背景概述](objbg.html)以及关于[常规背景](regbg.html)和[仿射变换矩阵](affine.html)的章节，请先去读那些再继续。

如果你知道如何构建常规背景，并且理解了仿射矩阵背后的概念，那么这里你应该没什么问题。仿射背景在理论层面与常规背景相同，但在若干非常关键的实践要点上会有所不同。举例来说，你使用的是不同的定位寄存器，而且它们的地图布局及其格式也各不相同。

GBA 拥有的四个背景中，只有最后两个能用作仿射背景，并且仅限于特定的视频模式（见 {@tbl:bg-types}）。仿射背景的尺寸也与常规背景不同。你可以在 {@tbl:bga-size} 中找到尺寸列表。

<div class="cblock">
  <table>
    <tr>
      <td>
        <table id="tbl:bg-types" border=1 cellpadding=2 cellspacing=0 width=128 class="table-data">
          <caption align="bottom"><b>{*@tbl:bg-types}</b>: 视频模式与背景类型</caption>
          <tbody align="center">
            <tr>
              <th>mode</th>
              <th>0</th>
              <th>1</th>
              <th>2</th>
            </tr>
            <tr>
              <th>bg0</th>
              <td>reg</td>
              <td>reg</td>
              <td>-</td>
            </tr>
            <tr>
              <th>bg1</th>
              <td>reg</td>
              <td>reg</td>
              <td>-</td>
            </tr>
            <tr>
              <th>bg2</th>
              <td>reg</td>
              <td>aff</td>
              <td>aff</td>
            </tr>
            <tr>
              <th>bg3</th>
              <td>reg</td>
              <td>-</td>
              <td>aff</td>
            </tr>
          </tbody>
        </table>
      </td>
      <td width="10%"></td>
      <td style="vertical-align: top;">
        <table id="tbl:bga-size" border=1 cellpadding=2 cellspacing=0 width=144 class="table-data">
          <caption align="bottom"><b>{*@tbl:bga-size}</b>: 仿射背景尺寸</caption>
          <col>
          <col class="def">
          <tbody align="center">
            <tr>
              <th>Sz</th>
              <th>define</th>
              <th>(tiles)</th>
              <th>(pixels)</th>
            </tr>
            <tr>
              <td>00</td>
              <td>BG_AFF_16x16</td>
              <td>16x16</td>
              <td>128x128</td>
            </tr>
            <tr>
              <td>01</td>
              <td>BG_AFF_32x32</td>
              <td>32x32</td>
              <td>256x256</td>
            </tr>
            <tr>
              <td>10</td>
              <td>BG_AFF_64x64</td>
              <td>64x64</td>
              <td>512x512</td>
            </tr>
            <tr>
              <td>11</td>
              <td>BG_AFF_128x128</td>
              <td>128x128</td>
              <td>1024x1024</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </table>
</div>

## 仿射背景寄存器 {#sec-regs}

与常规背景一样，仿射背景的主要控制寄存器是 `REG_BGxCNT`。如果你忘了它的作用，可以读[这里的描述](regbg.html#tbl-reg-bgxcnt)。与常规背景的差异在于尺寸，以及 `BG_WRAP` 现在真正起作用了。其它重要的寄存器是<dfn>位移向量</dfn> **dx**（`REG_BGxX` 和 `REG_BGxY`），以及<dfn>仿射矩阵</dfn> **P**（`REG_BGxPA`–`REG_BGxPD`）。你可以在 {@tbl:aff-regs} 中找到它们的地址。

<div class="lblock">
  <table id="tbl:aff-regs" class="table-data">
    <caption align="bottom"><b>{*@tbl:aff-regs}</b>: 仿射背景寄存器地址。注意 <i>x</i> 只能是 2 或 3！</caption>
    <col span=2 align="right">
    <tr>
      <th>Register</th>
      <th>length</th>
      <th>address</th>
    </tr>
    <tr>
      <th>REG_BGxCNT</th>
      <td>2</td>
      <td>0400:0008h + 2·x</td>
    </tr>
    <tr>
      <th>REG_BGxPA-PD</th>
      <td>2</td>
      <td>0400:0020h + 10h·(x-2)</td>
    </tr>
    <tr>
      <th>REG_BGxX</th>
      <td>4</td>
      <td>0400:0028h + 10h·(x-2)</td>
    </tr>
    <tr>
      <th>REG_BGxY</th>
      <td>4</td>
      <td>0400:002ch + 10h·(x-2)</td>
    </tr>
  </table>
</div>

在处理仿射背景的位移和变换时，有几点需要留意。首先，位移 *dx* 使用的是与常规背景不同的寄存器：`REG_BGxX` 和 `REG_BGxY`，而不是 `REG_BGxHOFS` 和 `REG_BGxVOFS`。第二点是，它们是 24.8 格式的定点数，而非像素偏移量。（实际上它们是 20.8 定点数，不过眼下这不重要。）

我通常通过 BG_AFFINE 结构体来使用仿射参数，而非 `REG_BGxPA` 等。*tonc_memmap.h* 中的内存映射为此提供了一个 `REG_BG_AFFINE`。以这种方式设置寄存器有时更有优势，因为你通常已经准备好了一个 BG_AFFINE 结构体，然后只需一次赋值就能把它复制到寄存器。下面给出一个例子。

仿射变换矩阵 **P** 的元素，其工作方式与仿射精灵完全相同：它们是 8.8 格式的定点数，描述从屏幕空间到纹理空间的变换。不过对于仿射背景，它们是连续存放的（偏移 2 字节），而精灵的那些则是以 8 字节为偏移。你可以使用 *tonc_bg_affine.c* 中的 `bg_aff_foo` 函数来把它们设为你想要的变换。

<div id="cd-bga-types">

```c
typedef struct tagBG_AFFINE
{
    s16 pa, pb;
    s16 pc, pd;
    s32 dx, dy
} ALIGN4 BG_AFFINE;

//! BG affine params array
#define REG_BG_AFFINE   ((BG_AFFINE*)(REG_BASE+0x0000))
```
</div>

```c
// Default BG_AFFINE data (tonc_core.c)
const BG_AFFINE bg_aff_default= { 256, 0, 0, 256, 0, 0 };

// Initialize affine registers for bg 2
REG_BG_AFFINE[2] = bg_aff_default;
```

:::warning 常规 vs 仿射图块地图的滚动

  仿射图块地图使用的是<strong>不同的</strong>滚动寄存器！它们用的是 REG_BG*x*X 和 REG_BG*x*Y，而不是 REG_BG*x*HOFS 和 REG_BG*x*VOFS。而且，这些是 32 位的定点数，而非半字。

:::

## 仿射背景的定位与变换 {#sec-aff-ofs}

既然我们知道了位移和变换寄存器是什么，现在就来看看它们的作用。这实际上比你可能以为的要棘手得多，所以请集中注意力。警告：接下来又要进入数学了。

位移向量 **dx** 的作用与常规背景相同：**dx** 包含被映射到屏幕原点的那些背景坐标。（而<strong>不是</strong>相反！）不过这一次 **dx** 是以定点数记法表示的。同样地，仿射变换矩阵 **P** 的作用也与仿射精灵相同：**P** 描述从屏幕空间到纹理空间的变换。用数学语言表达，如果我们定义

<table id="eq:defs">
  <tr>
    <td class="eqnrcell">({!@eq:defs}a)</td>
    <td class="eqcell">
      <i>T</i>(<b>dx</b>)<b>p</b> <b>:=</b> <b>p</b> + <b>dx</b><br>
      <i>T</i><sup>&minus;1</sup>(<b>dx</b>) = <i>T</i>(&minus;<b>dx</b>)
    </td>
  </tr>
  <tr>
    <td class="eqnrcell">({!@eq:defs}b)</td>
    <td class="eqcell"><b>P = A</b><sup>&minus;1</sup></td>
  </tr>
</table>

那么

<table id="eq:aff-defs">
  <tr>
    <td class="eqnrcell">({!@eq:aff-defs}a)</td>
    <td class="eqcell"><i>T</i>(<b>dx</b>)<b>q</b> = <b>p</b></td>
  </tr>
  <tr>
    <td class="eqnrcell">({!@eq:aff-defs}b)</td>
    <td class="eqcell"><b>P &middot; q</b> = <b>p</b></td>
  </tr>
</table>

其中

<table cellpadding=1 cellspacing=0>
  <tr>
    <th>p</th>
    <td>是纹理空间中的一个点，</td>
  </tr>
  <tr>
    <th>q</th>
    <td>是屏幕空间中的一个点，</td>
  </tr>
  <tr>
    <th>dx</th>
    <td>是位移向量（<code>REG_BGxX</code> 和 <code>REG_BGxY</code>）。</td>
  </tr>
  <tr>
    <th>A</th>
    <td>是从纹理空间到屏幕空间的变换，</td>
  </tr>
  <tr>
    <th>P</th>
    <td>是从屏幕空间到纹理空间的变换（<code>REG_BGxPA</code>–<code>REG_BGxPD</code>）。</td>
  </tr>
</table>
<br>

{@eq:aff-defs} 的问题在于，它们只描述了当你单独使用位移或变换时会发生什么。那么如果你两者都要用呢？这是一个重要的问题，因为变换的顺序是有影响的（就像我们在[仿射精灵演示](affobj.html#sec-demo)中看到的那样），而变换与位移的先后顺序同样如此。事实证明，平移是先做的：

<table id="eq:ofs">
  <tr>
    <td class="eqnrcell">({!@eq:ofs})</td>
    <td class="eqcell">
      <table class="eqtbl" cellpadding=2 cellspacing=0>
        <col align="right">
        <col align="center">
        <col align="left">
        <tr>
          <td><b>q</b></td>
          <td>=</td>
          <td><b>A</b> &middot; T(&minus;<b>dx</b>) <b>p</b></td>
        </tr>
        <tr>
          <td>T(<b>dx</b>) <b>P</b> &middot; <b>q</b></td>
          <td>=</td>
          <td><b>p</b></td>
        </tr>
        <tr>
          <td><b>dx</b> + <b>P</b> &middot; <b>q</b></td>
          <td>=</td>
          <td><b>p</b></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

换一种说法：变换始终以屏幕的左上角作为自己的原点，而位移则告诉你哪个背景像素被放到那里。当然，这种安排在你想要围绕屏幕上某个其它点旋转时没什么帮助。要做到这一点，你得玩几个小花招。为了一次性把它们都涵盖，我们把 {@eq:ofs} 与一般的坐标准换等式合并起来：

<table id="eq:aff-ofs">
  <tr>
    <td class="eqnrcell">({!@eq:aff-ofs})</td>
    <td class="eqcell">
      <table class="eqtbl" cellpadding=2 cellspacing=0>
        <col align="right">
        <col align="center">
        <col align="left">
        <tr>
          <td><b>dx + P &middot; q</b></td>
          <td>=</td>
          <td><b>p</b></td>
        </tr>
        <tr>
          <td class="bdrB"><b>P</b> &middot; (<b>q &minus; q</b><sub>0</sub>)</td>
          <td class="bdrB">=</td>
          <td class="bdrB"><b>p &minus; p</b><sub>0</sub></td>
          <td class="bdrB">&minus;</td>
        </tr>
        <tr>
          <td><b>dx + P &middot; q</b><sub>0</sub></td>
          <td>=</td>
          <td><b>p</b><sub>0</sub></td>
        </tr>
        <tr>
          <td><b>dx</b></td>
          <td>=</td>
          <td><b>p</b><sub>0</sub> &minus; <b>P &middot; q</b><sub>0</sub></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

那么，这玩意儿到底是什么意思？它的意思是：如果你把这个 **dx** 用作位移向量，你就是围绕纹理点 **p**<sub>0</sub> 进行变换，而该点最终会出现在屏幕点 **q**<sub>0</sub> 上；其中的 **P**·**q**<sub>0</sub> 项，是你在纹理空间中必须施加的修正量，目的是让旋转中心落在 **q**<sub>0</sub> 而非 (0,0)。所以——这玩意儿到底是什么意思？它的意思是：在你打算使用这些东西之前，应该先想清楚你实际想要达成的是什么效果，并且你要面对的是<strong>两套</strong>坐标系，而不是一套。想清楚之后，{@eq:aff-ofs} 的含义就会变得显而易见。无论如何，我所使用的函数是 `bg_rotscale_ex()`，它大体上长这样：

```c
typedef struct tagAFF_SRC_EX
{
    s32 tex_x, tex_y;   // 向量 p0：纹理空间中的原点（24.8f）
    s16 scr_x, scr_y;   // 向量 q0：屏幕空间中的原点（16.0f）
    s16 sx, sy;         // 缩放量（8.8f）
    u16 alpha;          // 逆时针角度（[0,0xFFFF] 内的整数）
} ALIGN4 AFF_SRC_EX;

void bg_rotscale_ex(BG_AFFINE *bgaff, const AFF_SRC_EX *asx)
{
    int sx= asx->sx, sy= asx->sy;
    int sina= lu_sin(asx->alpha), cosa= lu_cos(asx->alpha);

    FIXED pa, pb, pc, pd;
    pa=  sx*cosa>>12;   pb=-sx*sina>>12;    // .8f
    pc=  sy*sina>>12;   pd= sy*cosa>>12;    // .8f

    bgaff->pa= pa;  bgaff->pb= pb;
    bgaff->pc= pc;  bgaff->pd= pd;

    bgaff->dx= asx->tex_x - (pa*asx->scr_x + pb*asx->scr_y);
    bgaff->dy= asx->tex_y - (pc*asx->scr_x + pd*asx->scr_y);
}
```

这与[偏心对象变换](affobj.html#sec-combo)一节中讲到的 `obj_rotscale_ex()` 函数非常相似。数学是一样的，只是各项被稍微重新排布了一下。背景版本实际上更简单，因为仿射偏移修正可以在纹理空间中完成，而不必在屏幕空间中，这意味着无需去折腾 **P** 的逆矩阵。也无需处理精灵尺寸修正（多亏了 IPU）。作为记录，是的，你可以直接把这个函数用到 `REG_BG_AFFINE` 上。

### 内部参考点寄存器 {#ssec-bga-refpts}

关于位移和变换寄存器，还有一件重要的事要提。下面直接引用 [GBATEK](https://problemkaputt.de/gbatek.htm#lcdiobgrotationscaling)（方括号里的部分除外）：

> 上述参考点［即位移寄存器］会在每次 VBlank 期间被自动复制到内部寄存器，指定了第一条扫描线的原点。随后，这些内部寄存器会在每条扫描线之后，由 dmx［`REG_BGxPB`］和 dmy［`REG_BGxPD`］递增。

> 注意：在 VBlank 期间之外，由软件写入某个参考点寄存器，会立即把新值复制到相应的内部寄存器，也就是说：在当前这一帧中，新值指定的是<em>当前</em>扫描线的原点（而非最顶上的那条扫描线）。

通常这不会对你造成影响，但如果你试图在 HBlank 期间写入 `REG_BGxY`，事情可能就不会如你所愿。这是我在尝试让我的 Mode 7 代码跑起来时，付出了代价才学到的。不过这只影响仿射背景；常规背景使用的是其它寄存器。

## 映射格式 {#sec-map}

仿射背景的地图布局与屏幕项，都与常规背景大不相同。讽刺的是，它们其实也要简单得多。常规背景会把整张地图切分为四个象限（每个使用一个完整的屏幕块），而仿射背景使用的是扁平（flat）地图，这意味着用于取得屏幕项编号 *n* 的常规等式仍然成立，从而让事情简单了一大截。

<table id="eq:aff-sid">
  <tr>
    <td class="eqnrcell">({!@eq:aff-sid})</td>
    <td class="eqcell"><i>n</i> = <i>tx</i> + <i>ty</i>·<i>tw</i></td>
  </tr>
</table>

屏幕项本身也与常规背景的不同。在仿射地图中，它们是<strong>1 字节长</strong>，并且只包含要使用的图块索引。此外，你<strong>只能</strong>使用 256 色图块。这让你能访问基础字符块（charblock）里的所有图块，却访问不到它后面的那些。

大致上也就这些了。不，等等还有一件事：在填充或更改地图时要小心，因为 <strong>VRAM 每次只能以 16 或 32 位的方式访问</strong>。所以，如果你的地图存放在一个字节数组中，你得先把它转换成 `u16` 或 `u32`。或者使用 [DMA](dma.html)。好，我讲完了。

:::warning 常规 vs 仿射图块地图的映射差异

  常规地图与仿射地图的格式有两个重要区别。首先，仿射屏幕项仅仅是一个单字节的图块索引。其次，仿射地图使用的是线性布局，而非更大的常规地图所采用的、被切分为 32×32t 地图的那种布局。

:::

## *sbb_aff* 演示程序 {#sec-demo}

<div class="cpt_fr" style="width:240px">
  <img id="fig:sbb-aff" src="./img/demo/sbb_aff.png" alt="sbb_aff demo">
  <b>{*@fig:sbb-aff}</b>: <i>sbb_aff</i> 演示程序。
</div>

*sbb_aff* 之于仿射背景，就如同 *sbb_reg* 之于常规背景，只是多了一些额外内容。这个演示程序使用一张 64×64 图块的仿射背景，如 {@fig:sbb-aff} 所示。它被分成 16 个各 256 字节的部分，每一部分都用一种颜色的图块填满，并标有该部分的编号。现在，如果仿射背景的地图布局和常规背景相同，那么每个部分会形成一块 16×16t 的正方形。如果它是扁平的内存布局，那么每个部分就是一条 64×16t 的条带。正如你在 {@fig:sbb-aff} 中看到的那样，是后者。你还可以看到，与常规背景不同，这张地图在边缘处并不会自动环绕。

这个演示程序最有趣的地方，是那些小小的黑白十字准星。白色十字准星指示的是旋转点（锚点）。正如我之前所说，你不能简单地挑一个地图点 **p**<sub>0</sub> 然后说它就是“那个”旋转点。嗯，你可以这么做，但它不会给出想要的效果。仅仅使用一个地图点，会给你一个围绕该点旋转地图的效果，但在屏幕上它永远会待在左上角。要把地图锚点移动到屏幕上的特定位置，你还需要在那里放一个锚点。这就是 **q**<sub>0</sub>。把两者都代入 {@eq:aff-ofs}，就能求出你需要的位移向量：**dx** = **p**<sub>0</sub>−**P·q**<sub>0</sub>。这个 **dx** 会与 **p**<sub>0</sub> 和 **q**<sub>0</sub> 都大不相同。它的路径由黑色十字准星标出。

这个演示程序让你可以同时控制 **p**<sub>0</sub> 和 **q**<sub>0</sub>。当然还有旋转和缩放。完整的控制列表如下。

<div class="lblock">
  <table cellpadding=1 cellspacing=0>
    <tr>
      <th>D-pad</th>
      <td>移动地图旋转点，<b>p</b><sub>0</sub></td>
    </tr>
    <tr>
      <th>D-pad + A</th>
      <td>移动屏幕旋转点，<b>q</b><sub>0</sub></td>
    </tr>
    <tr>
      <th>L,R</th>
      <td>旋转背景。</td>
    </tr>
    <tr>
      <th>B(+Se)</th>
      <td>放大和缩小。</td>
    </tr>
    <tr>
      <th>St</th>
      <td>切换环绕标志。</td>
    </tr>
    <tr>
      <th>St+Se</th>
      <td>重置锚点和 <b>P</b></td>
    </tr>
  </table>
</div>

<div id="cd=sbb-aff">

```c
#include <stdio.h>
#include <tonc.h>
#include "nums.h"

#define MAP_AFF_SIZE 0x0100

// --------------------------------------------------------------------
// GLOBALS
// --------------------------------------------------------------------

OBJ_ATTR *obj_cross= &oam_mem[0];
OBJ_ATTR *obj_disp= &oam_mem[1];

BG_AFFINE bgaff;

// --------------------------------------------------------------------
// FUNCTIONS
// --------------------------------------------------------------------

void win_textbox(int bgnr, int left, int top, int right, int bottom, int bldy)
{
    REG_WIN0H= left<<8 | right;
    REG_WIN0V=  top<<8 | bottom;
    REG_WIN0CNT= WIN_ALL | WIN_BLD;
    REG_WINOUTCNT= WIN_ALL;

    REG_BLDCNT= (BLD_ALL&~BIT(bgnr)) | BLD_BLACK;
    REG_BLDY= bldy;

    REG_DISPCNT |= DCNT_WIN0;

    tte_set_margins(left, top, right, bottom);
}

void init_cross()
{
    TILE cross=
    {{
        0x00011100, 0x00100010, 0x01022201, 0x01021201,
        0x01022201, 0x00100010, 0x00011100, 0x00000000,
    }};
    tile_mem[4][1]= cross;

    pal_obj_mem[0x01]= pal_obj_mem[0x12]= CLR_WHITE;
    pal_obj_mem[0x02]= pal_obj_mem[0x11]= CLR_BLACK;

    obj_cross->attr2= 0x0001;
    obj_disp->attr2= 0x1001;
}

void init_map()
{
    int ii;

    memcpy32(&tile8_mem[0][1], nums8Tiles, nums8TilesLen/4);
    memcpy32(pal_bg_mem, numsPal, numsPalLen/4);

    REG_BG2CNT= BG_CBB(0) | BG_SBB(8) | BG_AFF_64x64;
    bgaff= bg_aff_default;

    // fill per 256 screen entries (=32x4 bands)
    u32 *pse= (u32*)se_mem[8];
    u32 ses= 0x01010101;
    for(ii=0; ii<16; ii++)
    {
        memset32(pse, ses, MAP_AFF_SIZE/4);
        pse += MAP_AFF_SIZE/4;
        ses += 0x01010101;
    }
}

void sbb_aff()
{
    AFF_SRC_EX asx=
    {
        32<<8, 64<<8,           // Map coords.
        120, 80,                // Screen coords.
        0x0100, 0x0100, 0       // Scales and angle.
    };

    const int DX=256;
    FIXED ss= 0x0100;

    while(1)
    {
        vid_vsync();
        key_poll();

        // dir + A : move map in screen coords
        if(key_is_down(KEY_A))
        {
            asx.scr_x += key_tri_horz();
            asx.scr_y += key_tri_vert();
        }
        else    // dir : move map in map coords
        {
            asx.tex_x -= DX*key_tri_horz();
            asx.tex_y -= DX*key_tri_vert();
        }
        // rotate
        asx.alpha -= 128*key_tri_shoulder();

        // B: scale up ; B+Se : scale down
        if(key_is_down(KEY_B))
            ss += (key_is_down(KEY_SELECT) ? -1 : 1);

        // St+Se : reset
        // St : toggle wrapping flag.
        if(key_hit(KEY_START))
        {
            if(key_is_down(KEY_SELECT))
            {
                asx.tex_x= asx.tex_y= 0;
                asx.scr_x= asx.scr_y= 0;
                asx.alpha= 0;
                ss= 1<<8;
            }
            else
                REG_BG2CNT ^= BG_WRAP;
        }

        asx.sx= asx.sy= (1<<16)/ss;

        bg_rotscale_ex(&bgaff, &asx);
        REG_BG_AFFINE[2]= bgaff;

        // the cross indicates the rotation point
        // (== p in map-space; q in screen-space)
        obj_set_pos(obj_cross, asx.scr_x-3, (asx.scr_y-3));
        obj_set_pos(obj_disp, (bgaff.dx>>8)-3, (bgaff.dy>>8)-3);

        tte_printf("#{es;P}p0\t: (%d, %d)\nq0\t: (%d, %d)\ndx\t: (%d, %d)",
            asx.tex_x>>8, asx.tex_y>>8, asx.scr_x, asx.scr_y,
            bgaff.dx>>8, bgaff.dy>>8);
    }
}

int main()
{
    init_map();
    init_cross();

    REG_DISPCNT= DCNT_MODE1 | DCNT_BG0 | DCNT_BG2 | DCNT_OBJ;

    tte_init_chr4_b4_default(0, BG_CBB(2)|BG_SBB(28));
    tte_init_con();
    win_textbox(0, 8, 120, 232, 156, 8);

    sbb_aff();

    return 0;
}
```
</div>
