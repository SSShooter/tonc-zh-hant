# 1. GBA 硬件

<!-- toc -->

## 初识 GBA {#sec-intro}

任天堂 Game Boy Advance（GBA 掌机）是一台便携式游戏主机。这你肯定早就知道了。它的 CPU 是一颗运行在 16.78 MHz 的 32 位 ARM7tdmi 芯片。它拥有若干不同的内存区域（例如工作 RAM、IO 和显存），我们稍后会逐一了解。游戏存储在 <dfn>Game Pak</dfn> 卡带上，由存放代码和数据的 ROM，以及相当常见的、用于保存游戏信息的 RAM 组成。GBA 拥有一块 240x160 的 LCD 屏幕，能够显示 32768 种颜色（15 位）。

遗憾的是，这块屏幕没有背光，这让很多人非常恼火，也被普遍认为是一个糟糕的决定。于是，在 2003 年，任天堂推出了 GBA SP，可以看作 GBA 2.0，它采用了一块可折叠的屏幕，让人想起老式的 Game & Watch 游戏（还记得吗？你记得？天哪，你真是*老了*！（值得一提的是，我也还留着我的那台 <kbd>:)</kbd> ））。随后迎来了最后的 GBA 版本——Game Boy Micro，一台非常小巧的 GBA，能轻松放进口袋。不过，GBA、GBA-SP 和 Micro 之间的差别主要是外观上的，从编程的角度来看，它们其实是同一个东西。

初代 Game Boy 在 1989 年风靡全球。对于一台单色掌机来说，这已经相当了不起了，不是吗？后来推出的 Game Boy Color 终于给这台老机器添上了一些色彩，但它本质上仍然是一台简单的 Game Boy。真正的继承者是 2001 年发布的 GBA。GBA 向后兼容 Game Boy，所以你也能玩所有老 GB 游戏。

在能力上，GBA 很像超级任天堂（SNES）：15 位色彩、多层背景，以及硬件旋转和缩放。当然，还有肩键。一个爱挑剔的人或许会看着那海量的 SNES 移植作品说，GBA *就是*一台 SNES，只不过便携而已。这话没错，但你很难说这是件坏事。

<div class="cblock">
  <table>
    <tbody valign="top">
      <tr>
        <td>
          <div class="cpt" style="width:288px;">
            <img src="./img/hardware/gba.jpg" id="fig:gba" alt="初代 GBA" width=288>
            <br>
            <b>{*@fig:gba}</b>: 初代 GBA。
          </div>
        </td>
        <td rowspan=2>
          <div class="cpt" style="width:256px;">
            <img src="./img/hardware/gba-sp.jpg" id="fig:gba-sp" alt="GBA-SP" width=256>
            <br>
            <b>{*@fig:gba-sp}</b>: GBA-SP。
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

## GBA 规格与能力 {#sec-specs}

下面是 GBA 的规格与能力列表。这并非完整列表，但列出了你最需要了解的最重要部分。

- 视频
    - 240x160 像素、15 位色彩 LCD 屏幕。初代 GBA 屏幕没有背光，但 SP 和 Micro 有。
    - 3 种[位图模式](bitmaps.html)、3 种[图块地图模式](regbg.html)以及[精灵](regobj.html)。
    - 4 个独立的图块地图图层（背景）和 128 个精灵（对象）。
    - 可对 2 个背景和 32 个对象进行[仿射变换](affine.html)（旋转/缩放/错切）。
    - [特殊图形效果](gfx.html)：马赛克、叠加混合、淡入白/黑。
- 声音
    - 总计 6 个声道
    - 来自初代 Game Boy 的 4 个音调发生器：2 个方波、1 个通用波形和 1 个噪声发生器。
    - 2 个"DirectSound"声道，用于播放采样和音乐。
- 其他
    - 10 个按键（或称[按键](keys.html)）：4 方向十字键、Select/Start、A/B 发射键、L/R 肩键。
    - 14 个硬件中断。
    - 通过 multiboot 线实现的 4 人多人模式。
    - 可选的红外、太阳能和陀螺仪接口。也有其他人制作的其他接口。
    - 主要编程平台：C/C++ 和汇编，不过也有适用于 Pascal、Forth、Lua 等的工具。易于上手，但要真正精通却很难。

从编程的角度看，GBA（或者说任何主机）与 PC 完全不同。没有操作系统，不用操心驱动和硬件兼容性问题；目光所及之处全是比特。嗯，PC 本质上也只是一堆比特，但那是在好几层抽象之下；而在主机上，只有你、CPU 和内存。基本上，这就是[真正的程序员](http://www.catb.org/~esr/jargon/html/R/Real-Programmer.html)的梦想。

要想做任何事，你需要用到<dfn>内存映射 IO</dfn>。特定的内存区域被直接映射到硬件功能上。例如，在第一个演示程序中，我们会把数字 `0x0403` 写到内存地址 `0400:0000h`。这告诉 GBA 启用背景 2，并将图形模式设为 3。而这到底*意味着*什么，当然正是本教程要讲的内容 <kbd>:)</kbd>。

### CPU {#ssec-cpu}

如前所述，GBA 运行在一颗频率为 16.78 MHz（2<sup>24</sup> 周期/秒）的 ARM7tdmi RISC 芯片上。它是一颗 32 位芯片，可以运行两套不同的指令集。首先是 <dfn>ARM 代码</dfn>，它是一套 32 位指令。其次是 <dfn>Thumb</dfn>，使用 16 位指令。Thumb 指令是 ARM 指令集的一个子集；由于指令更短，代码体积可以更小，但其能力也相应减弱。建议常规代码使用 ROM 中的 Thumb 代码，而对时间关键的代码则使用 ARM 代码并放在 IWRAM 中。由于所有 tonc 演示程序仍然相当简单，大多数（但并非全部）代码都是 Thumb 代码。

关于 CPU 的更多信息，请访问 [www.arm.com](http://www.arm.com) 或查看[汇编章](asm.html)。

## 内存分区 {#sec-memory}

本节列出了各个内存区域。它基本上是 [GBATEK](https://problemkaputt.de/gbatek.htm) 内存章节的摘要。

<div class="cblock">
  <table class="table-data">
    <col span=8 valign="top">
    <thead>
      <tr>
        <th>区域</th>
        <th>起始</th>
        <th>结束</th>
        <th>长度</th>
        <th>端口位宽</th>
        <th>描述</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>System ROM</th>
        <td><code>0000:0000</code></td>
        <td><code>0000:03FF</code></td>
        <td>16 KB</td>
        <td>32 bit</td>
        <td>BIOS 内存。你可以执行它，但不能读取它（换言之，可以摸，别看）。</td>
      </tr>
      <tr>
        <th>EWRAM</th>
        <td><code>0200:0000h</code></td>
        <td><code>0203:FFFFh</code></td>
        <td>256 KB</td>
        <td>16 bit</td>
        <td>外部工作 RAM。可供你的代码和数据使用。如果你在使用 multiboot 线，下载下来的代码会放在这里并从这里开始执行（正常情况下执行从 ROM 开始）。由于是 16 位端口，你希望这一区域的代码是 Thumb 代码。</td>
      </tr>
      <tr>
        <th>IWRAM</th>
        <td><code>0300:0000h</code></td>
        <td><code>0300:7FFFh</code></td>
        <td>32 KB</td>
        <td>32 bit</td>
        <td>同样可供代码和数据使用。32 位总线以及它内嵌于 CPU 的事实，使这成为最快的内存区域。32 位总线意味着 ARM 指令可以一次载入，所以把你的 ARM 代码放在这里。</td>
      </tr>
      <tr>
        <th>IO RAM</th>
        <td><code>0400:0000h</code></td>
        <td><code>0400:03FFh</code></td>
        <td>1 KB</td>
        <td>32 bit</td>
        <td>内存映射 IO 寄存器。它们与你在汇编中使用的 CPU 寄存器毫无关系，所以这个名字可能有点令人困惑。这可别怪我。你正是在这个区域控制图形、声音、按键和其他功能。</td>
      </tr>
      <tr>
        <th>PAL RAM</th>
        <td><code>0500:0000h</code></td>
        <td><code>0500:03FFh</code></td>
        <td>1 KB</td>
        <td>16 bit</td>
        <td>存放两个调色板的内存，每个含 256 个 15 位颜色项。第一个用于背景，第二个用于精灵。</td>
      </tr>
      <tr>
        <th>VRAM</th>
        <td><code>0600:0000h</code></td>
        <td><code>0601:7FFFh</code></td>
        <td>96 KB</td>
        <td>16 bit</td>
        <td>显存（Video RAM）。这里存放用于背景和精灵的数据。对这些数据的解读取决于若干因素，包括视频模式，以及背景和精灵的设置。</td>
      </tr>
      <tr>
        <th>OAM</th>
        <td><code>0700:0000h</code></td>
        <td><code>0700:03FFh</code></td>
        <td>1 KB</td>
        <td>32 bit</td>
        <td>对象属性内存（Object Attribute Memory）。你在这里控制精灵。</td>
      </tr>
      <tr>
        <th>PAK ROM</th>
        <td><code>0800:0000h</code></td>
        <td>var</td>
        <td>var</td>
        <td>16 bit</td>
        <td>Game Pak ROM。游戏就位于这里，执行也从这里开始，除非你正通过 multiboot 线运行。它的大小可变，但上限是 32 MB。它是 16 位总线，所以这里 Thumb 代码优于 ARM 代码。</td>
      </tr>
      <tr>
        <th>Cart RAM</th>
        <td><code>0E00:0000h</code></td>
        <td>var</td>
        <td>var</td>
        <td>8 bit</td>
        <td>这里存放存档数据。Cart RAM 可以是 SRAM、Flash ROM 或 EEPROM 的形式。从编程角度看，它们都做同一件事：存储数据。总大小可变，但 64 KB 是个不错的参考值。</td>
      </tr>
    </tbody>
  </table>
</div>

各个 RAM 区域（Cart RAM 除外）都会在 BIOS 启动时清零。你最经常打交道的区域是 IO、PAL、VRAM 和 OAM。对于简单的游戏和演示程序，通常只需在开始时把图形数据载入 PAL 和 VRAM，并用 IO 和 OAM 来处理实际的交互就足够了。这两个区域（IO 和 OAM）的布局相当复杂，几乎不可能独自琢磨出来（说"几乎"，是因为模拟器作者显然已经做到了）。考虑到这一点，像 [GBATEK](https://problemkaputt.de/gbatek.htm) 和 [CowBite Spec](http://www.cs.rit.edu/~tjh8300/CowBite/CowBiteSpec.htm) 这样的参考文档是不可或缺的。理论上，这些就是你上手所需的全部，但在实践中，使用一个或多个带有示例代码教程（比如本教程）会省去很多头疼的事。
