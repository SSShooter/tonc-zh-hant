# 20. Mode 7 第 1 部分

<!-- toc -->

好，现在来讲点酷的东西：Mode 7。不仅是在 GBA 上如何实现它，还有它背后的数学。你需要先了解[图块背景](regbg.html)（尤其是[可变换的](affbg.html)那些）以及[中断](interrupts.html)。如果还不了解，请先去读这些主题。这里的内容解释了 Mode 7 的基础。我还有一页[进阶内容](mode7ex.html)，但我强烈建议你先读这一页，因为那里的数学比这里的要难上不少。

## 简介 {#sec-intro}

时光倒退回 1990 年，那时有超级任天堂（Super NES），也就是任天堂娱乐系统（NES）的 16 位后继机种。除了新技术天然带来的那些常见改进之外，SNES 还是第一台拥有特殊图形硬件、能对任意背景和精灵进行线性变换（比如旋转和缩放）的家用机。<dfn>Mode7</dfn> 把这一步推得更远：它不仅能旋转和缩放背景，还额外加入了一个透视步骤，从而创造出 3D 观感。

很难说 Mode 7 只是又一个漂亮的噱头。举例来说，它彻底改变了竞速游戏这个类型。更老的竞速游戏（比如 Pole Position 和 Outrun）只能做简单的左右弯。Mode 7 则能呈现更有意思的赛道，因为你的视野不再局限于正前方的那一小段路面。F-Zero 是第一个使用它的游戏，并且把之前的一切都碾压了（原版的 Fire Field 至今仍是最凶残的赛道之一，有着发卡弯、磁力光束和地雷）。其它知名的游戏很快接踵而至，比如超级马里奥赛车（嗯嗯，彩虹之路。150cc，全程油门到底 \*gargle\*）和 Pilotwings。

由于 GBA 本质上就是一台迷你 SNES，按理说你也能在它上面做 Mode 7 图形。而且，你是对的，尽管我听说 GBA 的 Mode 7 与 SNES 的略有不同。在 SNES 上，视频模式确实一直排到了 #7（参见 [SNESdev Wiki](https://snes.nesdev.org/wiki/Backgrounds)）。GBA 却只有模式 0–5。所以严格来说，“GBA Mode 7”又是一个误称。不过，对于所有不是 SNES 程序员的人来说（这<em>几乎</em>包括了所有人，也包括我），这个词与它所闻名于世的图形效果——一个透视视图——是同义的。而你在 GBA 上确实可以创建一个透视视图，所以从这个意义上说，这个词仍然成立。

我不敢确定 SNES 的情况，但 GBA 的 Mode 7 与 OpenGL 和 Direct3D 这类真正的 3D API 非常不同。在那些系统上，你只需给出正确的透视矩阵，然后把它塞进渲染管线即可。然而在 GBA 上，你手头只有一个通用的 2D 变换矩阵 **P** 和位移 **dx**，而且所有的透视计算都得你自己来做。这基本上意味着，你必须在每条扫描线上改变缩放和位移，使用 HBlank DMA 或 HBlank 中断来达成。

在本教程中，我会使用来自 [sbb_aff](affbg.html#sec-demo) 演示程序的那张 64×64t 仿射背景（长得有点像 @fig:img-m7-map），施展 Mode 7 的魔法，把它变成类似 @fig:img-m7-persp 中所描绘的样子。重点会放在详细展示这魔法究竟是如何运作的。虽然最终结果是以一个 HBlank 中断函数的形式给出的，但改写成 HBlank DMA 的情形应该也不算太难。

<div class="lblock">
  <table>
    <tr valign="top">
    <td>
      <div class="cpt" style="width:256px;">
        <img src="img/mode7/m7_map.png" id="fig:img-m7-map" alt="This is your map.">
        <br>
        <b>*@fig:img-m7-map</b>: 这是你的地图（嗯，差不多）。
      </div>
    <td>
      <div class="cpt" style="width:240px;">
        <img src="img/mode7/m7_persp.png" id="fig:img-m7-persp" alt="This is your map in mode7.">
        <br>
        <b>*@fig:img-m7-persp</b>: 这是你的地图在 mode7 下的样子。
      </div>
  </table>
</div>

## 建立透视感 {#sec-persp}

（如果你已经熟悉透视的基础知识，可以只粗略地浏览这一节。）
如果你曾经看过世界地图或玩过 3D 游戏，你就会知道，当从 3D 映射到 2D 时，总有些东西得做出让步。这件事的术语叫做<dfn>投影</dfn>。投影有许多类型，但我们关心的是<dfn>透视</dfn>，它让物体看起来离得越远就越小。

我们从一个类似 @fig:img-3dview 中的 3D 空间开始。在计算机图形学中，习惯上让 _x_ 轴指向右方，_y_ 轴指向上方。_z_ 轴则是由空间的手性（handedness）决定的：在<dfn>右手系</dfn>中它指向后方（屏幕之外），而在左手系中它指向前方。我使用的是右手系，因为一碰到旋转和计算法线，左手系就会把我搞得晕头转向。另一个原因是，这样屏幕坐标就与 (_x_, _z_) 值对应了。把观察者放在原点也是惯例（对于不同的观察者位置，只需把世界向相反方向平移即可）。对于右手系来说，这意味着你是在沿着负的 _z_ 轴看过去。

当然，你不可能看到一切：只有位于<dfn>视域</dfn>内部的物体才可见。对于透视投影来说，视域由观察者位置（在我们的例子中是原点）和<dfn>投影平面</dfn>定义，后者位于观察者前方距离为 _D_ 的地方。把它想象成屏幕。投影平面有宽度 _W_ 和高度 _H_。所以视域实际上是一个<dfn>视锥</dfn>，尽管在实践中它通常是一个视<em>截台</em>（被砍掉头的金字塔），因为你所能感知的距离同样有最小值和最大值。

{\*@fig:img-side1} 展示了透视投影实际所做的事。给定一个被投影到点 (_y_<sub>p</sub>, −*D*) 的点 (_y_, _z_)。按照定义，投影后的 _z_ 坐标就是 −*D*。投影后的 _y_ 坐标，是投影平面与那条穿过观察者和原始点的直线的交点：

<table id="eq:persp">
  <tr>
    <td class="eqnrcell">(!@eq:persp)
    <td class="eqcell">
      <math display="block" class="tml-display" style="display:block math;">
        <mrow>
          <msub>
            <mi>y</mi>
            <mi>p</mi>
          </msub>
          <mo>=</mo>
          <mi>y</mi>
          <mo>·</mo>
          <mi>D</mi>
          <mo lspace="0em" rspace="0em">⁄</mo>
          <mi>z</mi>
        </mrow>
      </math>
</table>

基本上，你要除以
<math style="display: inline-block math;">
<mrow>
<mi>z</mi>
<mo lspace="0em" rspace="0em">/</mo>
<mi>D</mi>
</mrow>
</math>。
由于它是一个如此重要的因子，它有自己的变量名：<dfn>缩放因子</dfn> λ：

<table id="eq:lambda">
  <tr>
    <td class="eqnrcell">(!@eq:lambda)
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>&#x3BB;</mi>
                  <mo>=</mo>
                  <mi>z</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <mi>D</mi>
                  <mo>=</mo>
                  <mi>y</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <msub>
                    <mi>y</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>p</mi>
                    </mrow>
                  </msub>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
</table>

通常的规律是：位于投影平面之前（λ\<1）的一切都会被放大，而在它之后（λ\>1）的一切则会被缩小。

<div class="cblock">
  <table>
    <tr valign="top">
      <td>
        <div class="cpt" style="width:256px;">
          <img src="img/mode7/m7_3dview.png" id="fig:img-3dview" alt="3D coordinate system">
          <br>
          <b>*@fig:img-3dview</b>:
          三维坐标系，展示了由原点和位于 <i>z</i>= &minus;<i>D</i> 处的屏幕矩形（<i>W</i>&times;<i>H</i>）所定义的视锥
        </div>
      <td>
        <div class="cpt" style="width:320px;">
          <img src="img/mode7/m7_side1.png" id="fig:img-side1" alt="projection step, side view">
          <br>
          <b>*@fig:img-side1</b>:
          侧视图；点 (<i>y, z</i>) 被投影到 (<i>z</i> = &minus;<i>D</i>) 平面上。投影后的点是 <i>y</i><sub>p</sub> =  <i>y·D/z</i>
        </div>
  </table>
</div>

## 进入 Mode 7 {#sec-m7-math}

{\*@fig:img-3dview} 和 @fig:img-side1 描述的是一个拥有大量物体和观察者朝向的 3D 世界中透视投影的普遍情形。Mode 7 的情况要比那简单得多：

- **物体**。我们只处理两个物体：观察者（位于点 **a** = (_a_<sub>x</sub>, _a_<sub>y</sub>, _a_<sub>z</sub>)）和地面（按定义为 _y_=0）。
- **观察者朝向**。在一个完整的 3D 世界中，观察者朝向由 3 个角度给出：偏航（yaw，y 轴）、俯仰（pitch，x 轴）和翻滚（roll，z 轴）。为了简单，我们只保留偏航。
- **地平线问题**。由于视线方向与地面保持平行，地平线应当位于屏幕的中央。那样一来屏幕的上半部分就会空着，有点浪费。为了弥补这一点，我们只使用视域的下半部分，从而让地平线处在屏幕的顶端。请注意，尽管现在的上下视线和你略微向下看时是一样的，但两种情况<strong>并不</strong>相等，因为投影平面仍然是竖直的。意识到这一区别很重要。

<div class="lblock">
  <div class="cpt" style="width:320px;">
    <img src="img/mode7/m7_side2.png" id="fig:img-side2" alt="Side view of Mode7 perspective">
    <b>*@fig:img-side2</b>: Mode 7 透视的侧视图
  </div>
</div>

{\*@fig:img-side2} 展示了整个情形。一个位于 *y* = *a*<sub>y</sub> 的观察者正沿着负的 z 方向看去。在观察者前方距离 _D_ 处是投影平面，其下半部分显示在高度为 _H_（=160）的 GBA 屏幕上。现在到了有趣的部分。GBA 没有任何真正的 3D 硬件能力，但你可以通过巧妙地操纵每条扫描线上的缩放和位移 `REG_BGxX-REG_BGxPD` 来伪造它。你只需要搞清楚地图的哪一部分落在哪条扫描线上，以及处于哪个缩放级别。实际上，你是在构建一个非常简单的光线投射器（ray-caster）。

### 数学原理 {#ssec-math-math}

从概念上讲，Mode 7 包含四个步骤，描绘在 {@fig:img-steps}a–d 中。绿色图形表示原始地图；红色是运算之后的地图。给定一条扫描线 _h_，我们要做的是：

1. **预平移** 通过 **a** = (_a_<sub>x</sub>, _a_<sub>z</sub>)。这把观察者放到了原点，而这正是步骤 b 和 c 所需要的。
2. **旋转** 通过 α。这处理偏航角。这些步骤与普通的、可变换的背景是一样的，所以理解它们对你来说应该不成问题。
3. **透视除法**。接下来，我们整体缩放 1/λ。由 @eq:lambda 可知 λ = *a*<sub>y</sub>/_h_。直线 *z* = *z*<sub>h</sub> 是理应落在扫描线 _h_ 上的那条直线。这条直线在缩放之后的新位置是 _z_ = −*D*，因为那正是透视除法的全部意义所在。
4. **后平移** 通过 (−**x**<sub>s</sub>)。注意那个负号。在透视除法之后，剩下的就是把完全变换过的地图移回它应有的屏幕位置（米黄色区域）。出于显而易见的原因，水平分量应当等于屏幕宽度的一半。竖直方向的移动则应当把地面线移到那条扫描线上，于是这个向量是：

<table id="eq:post-ofs">
<tr>
  <td class="eqnrcell">(!@eq:post-ofs)
  <td class="eqcell">
  <table class="eqtbl" cellpadding=2 cellspacing=0>
  <col align="right">
  <col align="center">
  <col align="left">
  <tr>
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <msub>
                  <mi>x</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>s</mi>
                  </mrow>
                </msub>
                <mo>=</mo>
                <mi>W</mi>
                <mrow data-mjx-texclass="ORD">
                  <mo>/</mo>
                </mrow>
                <mn>2</mn>
                <mo>=</mo>
                <mn>120</mn>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
  <tr>
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <msub>
                  <mi>y</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>s</mi>
                  </mrow>
                </msub>
                <mo>=</mo>
                <mo stretchy="false">(</mo>
                <mi>D</mi>
                <mo>+</mo>
                <mi>h</mi>
                <mo stretchy="false">)</mo>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
  </table>
</table>

<div class="cblock">
  <table id="fig:img-steps" border=1 cellpadding=4 cellspacing=0>
    <caption align="bottom">
      {*@fig:img-steps}a-d: Mode 7 的四个步骤
    </caption>
    <tr>
      <td><img src="img/mode7/m7_step1.png" alt="pre-translate">
      <td><img src="img/mode7/m7_step2.png" alt="rotate">
      <td><img src="img/mode7/m7_step3.png" alt="scale">
      <td><img src="img/mode7/m7_step4.png" alt="post-translate">
    <tr>
      <td>{*@fig:img-steps}a: 通过 (<i>a</i><sub>x</sub>, <i>a</i><sub>z</sub>) 预平移
      <td>{*@fig:img-steps}b: 通过 &alpha; 旋转
      <td>{*@fig:img-steps}c: 通过 1/&lambda; 缩放
      <td>{*@fig:img-steps}d: 通过 (<i>x</i><sub>s</sub>, <i>y</i><sub>s</sub>) 后平移
  </table>
</div>

### 汇总整合 {#ssec-math-combine}

虽然上面描述的步骤确实是完整的过程，但仍有若干松散的线头需要收拢。首先，请记住 GBA 的变换矩阵 **P** 映射的方向是从屏幕空间到背景空间，而这其实与你想要做的方向相反。所以你应该使用的是：

<table id="eq:prs">
<tr>
  <td class="eqnrcell">(!@eq:prs)
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtext mathvariant="bold">P</mtext>
                <mo>=</mo>
                <mtext mathvariant="bold">S</mtext>
                <mo stretchy="false">(</mo>
                <mi>&#x3BB;</mi>
                <mo stretchy="false">)</mo>
                <mo>&#x22C5;</mo>
                <mtext mathvariant="bold">R</mtext>
                <mo stretchy="false">(</mo>
                <mi>a</mi>
                <mo stretchy="false">)</mo>
                <mo>=</mo>
                <mrow data-mjx-texclass="INNER">
                  <mo data-mjx-texclass="OPEN">[</mo>
                  <mtable columnspacing="1em" rowspacing="4pt">
                    <mtr>
                      <mtd>
                        <mi>&#x3BB;</mi>
                        <mo>&#x22C5;</mo>
                        <mi>cos</mi>
                        <mo data-mjx-texclass="NONE">&#x2061;</mo>
                        <mrow>
                          <mo data-mjx-texclass="OPEN">(</mo>
                          <mi>a</mi>
                          <mo data-mjx-texclass="CLOSE">)</mo>
                        </mrow>
                      </mtd>
                      <mtd>
                        <mo>&#x2212;</mo>
                        <mi>&#x3BB;</mi>
                        <mo>&#x22C5;</mo>
                        <mi>sin</mi>
                        <mo data-mjx-texclass="NONE">&#x2061;</mo>
                        <mrow>
                          <mo data-mjx-texclass="OPEN">(</mo>
                          <mi>a</mi>
                          <mo data-mjx-texclass="CLOSE">)</mo>
                        </mrow>
                      </mtd>
                    </mtr>
                    <mtr>
                      <mtd>
                        <mi>&#x3BB;</mi>
                        <mo>&#x22C5;</mo>
                        <mi>sin</mi>
                        <mo data-mjx-texclass="NONE">&#x2061;</mo>
                        <mrow>
                          <mo data-mjx-texclass="OPEN">(</mo>
                          <mi>a</mi>
                          <mo data-mjx-texclass="CLOSE">)</mo>
                        </mrow>
                      </mtd>
                      <mtd>
                        <mi>&#x3BB;</mi>
                        <mo>&#x22C5;</mo>
                        <mi>cos</mi>
                        <mo data-mjx-texclass="NONE">&#x2061;</mo>
                        <mrow>
                          <mo data-mjx-texclass="OPEN">(</mo>
                          <mi>a</mi>
                          <mo data-mjx-texclass="CLOSE">)</mo>
                        </mrow>
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
  </table>
</table>

是的，那个负号对于逆时针旋转是正确的（**R** 被定义为顺时针旋转）。另外请记住，GBA 使用的屏幕点 **q** 与背景点 **p** 之间的关系是：

<table id="eq-ofs-base">
  <tr>
    <td class="eqnrcell">(20.5)
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>d</mi>
                  <mi>x</mi>
                  <mo>+</mo>
                  <mi>P</mi>
                  <mo>&#x22C5;</mo>
                  <mi>q</mi>
                  <mo>=</mo>
                  <mi>p</mi>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
</table>

也就是说，是<strong>一次</strong>平移和<strong>一次</strong>变换。我们得把预平移和后平移合并起来，才能让它生效。我们在 [affbg.html#sec-aff-ofs](affbg.html#sec-aff-ofs) 的等式 4 中其实已经见过这个了，只是名字不同。总之，你需要的是：

<table id="eq-aff-ofs">
<tr>
  <td class="eqnrcell">(20.6)
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtable displaystyle="true" columnalign="right left" columnspacing="0em" columnwidth="auto auto" rowspacing="3pt" data-width-includes-label="true">
                  <mtr>
                    <mtd></mtd>
                    <mtd>
                      <mi>d</mi>
                      <mi>x</mi>
                      <mo>+</mo>
                      <mi>P</mi>
                      <mo>&#x22C5;</mo>
                      <mi>q</mi>
                      <mo>=</mo>
                      <mi>p</mi>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd></mtd>
                    <mtd>
                      <mi>P</mi>
                      <mo>&#x22C5;</mo>
                      <mo stretchy="false">(</mo>
                      <mi>q</mi>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>x</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>s</mi>
                        </mrow>
                      </msub>
                      <mo stretchy="false">)</mo>
                      <mo>=</mo>
                      <mi>p</mi>
                      <mo>&#x2212;</mo>
                      <mi>a</mi>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd></mtd>
                    <mtd>
                      <mspace width="5cm" height="1pt" style="background: var(--fg);"></mspace>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd></mtd>
                    <mtd>
                      <mi>d</mi>
                      <mi>x</mi>
                      <mo>+</mo>
                      <mi>P</mi>
                      <mo>&#x22C5;</mo>
                      <msub>
                        <mi>x</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>s</mi>
                        </mrow>
                      </msub>
                      <mo>=</mo>
                      <mi>a</mi>
                    </mtd>
                  </mtr>
                  <mtr>
                    <td></td>
                    <td>
                      <mi>d</mi>
                      <mi>x</mi>
                      <mo>=</mo>
                      <mi>a</mi>
                      <mo>&#x2212;</mo>
                      <mi>P</mi>
                      <mo>&#x22C5;</mo>
                      <msub>
                        <mi>x</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>s</mi>
                        </mrow>
                      </msub>
                    </mtd>
                  </mtr>
                </mtable>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
</table>

所以，对于每条扫描线，你计算缩放因子，把 @eq:prs 中的 **P** 矩阵写入 `REG_BGxPA-REG_BGxPD`，再把 **a−P·x**<sub>s</sub> 写入 `REG_BGxX` 和 `REG_BGxY`，然后——搞定！瞬间就做出了 Mode 7。

嗯，差不多。请[记住](affbg.html#ssec-ao-refpts)在 HBlank 中断里写入 `REG_BGxY` 时会发生什么：当前扫描线会被当作屏幕的原点零行。换句话说，它会自动替你完成 _y<sub>s</sub>_ 中那个 _+h_ 的部分。把真正的 _y_<sub>s</sub> 重命名为 _y_<sub>s0</sub>，你<strong>应该</strong>用的是

<table id="eq-yofs">
<tr>
  <td class="eqnrcell">(20.7)
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <msub>
                  <mi>y</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>s</mi>
                  </mrow>
                </msub>
                <mo>=</mo>
                <msub>
                  <mi>y</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>s</mi>
                    <mn>0</mn>
                  </mrow>
                </msub>
                <mo>&#x2212;</mo>
                <mi>h</mi>
                <mo>=</mo>
                <mi>D</mi>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
</table>

现在，理论上你已拥有一切所需。不过在实践中，还是有不少地方可能出错。在我深入那些之前，先来看一个漂亮（并不那么小）的演示程序。

## 三重演示程序 {#sec-demo}

和往常一样，这里有一个演示程序。其实我有好几个 Mode 7 的演示，但那现在并不重要。这个演示叫做 `m7_demo`，控制方式如下：

<table>
  <col valign="top">
  <tr><th>D-pad<td>平移（Strafe）。
  <tr><th>L, R<td>向左和向右转（即，分别把地图向右和向左旋转）
  <tr><th>A, B<td>向上和向下移动，不过我忘了哪个是哪个。
  <tr><th>Select<td>在 3 种不同的 Mode7 类型（A、B、C）之间切换
  <tr><th>Start<td>重置所有数值（<b>a</b>= (256, 32, 256)，&alpha;= 0）
</table>

“在 3 种不同的 Mode7 类型之间切换”？没错，正是我说的。请务必在三种类型中都四处移动一下。拜托了。左上角有一个标签，指示当前的类型。

<div class="cblock">
  <table id="img-types">
    <tr>
      <td>
        <div class="cpt" style="width:240px;">
          <img src="img/demo/m7_demo_a.png" alt="blocky"><br>
          <b>Fig 20.7a</b>: 类型 A：块状。
        </div>
      <td>
        <div class="cpt" style="width:240px;">
          <img src="img/demo/m7_demo_b.png" alt="sawtooth"><br>
          <b>Fig 20.7b</b>: 类型 B：锯齿状。
        </div>
    <tr>
      <td colspan=2 align="center">
        <div class="cpt" style="width:240px;">
          <img src="img/demo/m7_demo_c.png" alt="smooth"><br>
          <b>Fig 20.7c</b>: 类型 C：平滑。
        </div>
  </table>
</div>

## 顺序，顺序！ {#sec-order}

稍微摆弄了一下我的演示程序？很好。注意到三种类型之间的差别了？那就更好了！作为参考，看看图 20.7a–c，它们与这些类型一一对应。它们清楚地展示了不同之处。

- 类型 A 糟糕地呈块状。那些红色图块里的数字本该是“8”。嘿，数字？什么数字！
- 类型 B 好一些。左侧是平滑的，但右侧仍有些麻烦。不过至少发挥一点想象力，你还是能看到八的。
- 类型 C。这才像话嘛！中心线很清晰，而这一点很重要，因为你大部分时间看的就是它。但即使在两侧，情况也相当不错。

于是我们有了三个截然不同的 Mode 7 结果，但我向你保证，它们全部建立在同样的数学之上。那么，为什么一种方法看起来如此糟糕，而另一种看起来如此出色？

### 代码 {#ssec-order-code}

这里是创建这些类型的两个 HBlank 中断服务程序（ISR）。类型 A 和 B 几乎一模一样，除了一点。类型 C 则与另外两个大不相同。如果你有自虐倾向，试着仅从代码出发来解释这些差异。我昨晚大半夜都在琢磨到底是什么让类型 C 生效，所以我有一半心思想就让你这么悬着。不过对你来说幸运的是，那一半现在正睡着。

```c
#define M7_D   128

extern VECTOR cam_pos;          // 摄像机位置
extern FIXED g_cosf, g_sinf;    // cos(phi) 和 sin(phi)，.8f
```

<pre><code class="language-c hljs">// --- 类型 A ---
<span class="rem">// (offset * zoom) * rotation
// 全部为 .8 定点</span>
void m7_hbl_a()
{
    FIXED lam, xs, ys;

    lam= cam_pos.y*lu_div(REG_VCOUNT)&gt;&gt;16;  // .8*.16/.16 = .8

    // 计算偏移量 (.8)
    xs= 120*lam;
    ys= M7_D*lam;

    REG_BG2PA= (g_cosf*lam)&gt;&gt;8;
    REG_BG2PC= (g_sinf*lam)&gt;&gt;8;

    REG_BG2X = cam_pos.x - ( (xs*g_cosf-ys*g_sinf)&gt;&gt;8 );
    REG_BG2Y = cam_pos.z - ( (xs*g_sinf+ys*g_cosf)&gt;&gt;8 );  
}
</code></pre>

<pre><code class="language-c hljs">// --- 类型 B ---
<span class="rem">// (offset * zoom) * rotation
// 混合定点：lam、xs、ys 使用 .12</span>
void m7_hbl_b()
{
    FIXED lam, xs, ys;

    lam= cam_pos.y*lu_div(REG_VCOUNT)&gt;&gt;12;  // .8*.16/.12 = .12

    // 计算偏移量 (.12f)
    xs= 120*lam;
    ys= M7_D*lam;

    REG_BG2PA= (g_cosf*lam)&gt;&gt;12;
    REG_BG2PC= (g_sinf*lam)&gt;&gt;12;

    REG_BG2X = cam_pos.x - ( (xs*g_cosf-ys*g_sinf)&gt;&gt;12 );
    REG_BG2Y = cam_pos.z - ( (xs*g_sinf+ys*g_cosf)&gt;&gt;12 );   
}
</code></pre>

<pre><code class="language-c hljs">// --- 类型 C ---
<span class="rem">// offset * (zoom * rotation)
// 混合定点：lam、lcf、lsf 使用 .12
// lxr 和 lyr 有不同的计算方法</span>
void m7_hbl_c()
{
    FIXED lam, lcf, lsf, lxr, lyr;

    lam= cam_pos.y*lu_div(REG_VCOUNT)&gt;&gt;12;  // .8*.16 /.12 = 20.12
    lcf= lam*g_cosf&gt;&gt;8;                     // .12*.8 /.8 = .12
    lsf= lam*g_sinf&gt;&gt;8;                     // .12*.8 /.8 = .12
    
    REG_BG2PA= lcf&gt;&gt;4;
    REG_BG2PC= lsf&gt;&gt;4;

    // 偏移量
    // 注意 lxr 先向下移位！

    // 水平偏移量
    lxr= 120*(lcf&gt;&gt;4);      lyr= (M7_D*lsf)&gt;&gt;4;
    REG_BG2X= cam_pos.x - lxr + lyr;

    // 竖直偏移量
    lxr= 120*(lsf&gt;&gt;4);      lyr= (M7_D*lcf)&gt;&gt;4; 
    REG_BG2Y= cam_pos.z - lxr - lyr;
}
</code></pre>

### 讨论（技术向） {#ssec-order-disc}

三个版本都做了如下这些事：使用等式 2 和一个除法查找表来计算缩放因子 λ，使用 λ 以及 cos(φ)、sin(φ) 的存储版本来计算仿射矩阵，并计算仿射偏移量。请注意，实际上只计算了 _p_<sub>a</sub> 和 _p_<sub>c</sub>；因为扫描线偏移量始终 effectively 为零，_p_<sub>b</sub> 和 _p_<sub>d</sub> 不起作用，可以忽略。这些是相同点，但更有趣的是它们之间的差异：

1.  **定点数**。类型 A 全程使用 .8 定点数运算，而 B 和 C 则混用了 .12 和 .8 定点数。
2.  **仿射偏移量的计算顺序** 仿射位移 **dx** 是三个部分组合而成的：缩放、旋转和偏移。类型 A 和 B 使用 **dx** = (offset\*scale)\*rotation，而 C 使用 **dx** = offset\*(scale\*rotation)。因为类型 C 把偏移放在最后做，它也可以为偏移使用不同的定点数。

<div class="cpt_fr">
<table id="tbl:divs" class="table-data">
  <caption align= bottom>
      <b>*@tbl:divs</b>: 除法表和缩放因子。<i>a</i><sub>y</sub>=32
  </caption>
  <tr><th>h	<th>1/h			<th>&lambda; (true)	<th>&lambda;(.8)
  <tr><td>157	<td>0.01a16d..h	<td>0.342da7h	<td>0.34h
  <tr><td>158	<td>0.019ec8..h	<td>0.33d91dh	<td>0.33h
  <tr><td>159	<td>0.019c2d..h	<td>0.3385a2h	<td>0.33h
  <tr><td>160	<td>0.019999..h	<td>0.333333h	<td>0.33h
</table>
</div>

这两点（嗯，确切地说两点半）差异，足以解释结果上的不同。请记住，代码中的差异相当微妙：定点数在游戏机之外很少被使用，而结果因为计算顺序的不同而改变，可能更加罕见。然而，正是这两点在这里造成了所有的差别。

让我们从类型 A 和 B 开始，它们仅因 `lam` 的定点数位数而不同。λ 是摄像机高度与扫描线的比值，这个数往往相当小——无论如何都小于 1。@tbl:divs 展示了其中几个数值。请注意，使用一个只有 8 个小数位的 λ，意味着你会经常为多条约扫描线得到相同的数值，而它会一直传递到后续的计算中。这就是为什么类型 A——规规矩矩地像一个乖孩子那样使用固定的 .8 定点数——在低空时会如此呈块状。类型 B 多出的那 4 个位带来了好得多的结果。规矩固然好，但有时为了出成果，它们需要被打破。

现在，你会注意到类型 B 仍然有一点失真，那么为什么类型 B 只用到 .12 定点数，而不用到 16 呢？嗯，用 16 的话你可能会遭遇整数溢出。对于计算 `xs` 和 `ys` 来说那倒还好，但我们稍后还得对这些值进行旋转。好吧，那我们就用 64 位数学，这样 32 位溢出就无关紧要，从而能用<em>更多</em>的定点位数！毕竟，越多 == 越好，对吧？

嗯，不对。更大/更强/更多并不总是意味着更好（看看 DS 对 PSP 就知道了）。余下的失真并非定点数位数的问题；至少不完全是。你大可以用 128 位数学和 .32f 的除法与三角函数表，我无所谓；但在这里那无关紧要，因为问题不在这儿。

问题（或者说至少部分问题）出在类型 A 和 B 使用的基本算法上。如果你回看理论，会发现仿射矩阵是先计算的，然后才是偏移量。换句话说，先把缩放和旋转合并，再计算偏移修正量，**P**·**x**<sub>s</sub>。反正 GBA 里的仿射参数就是这样运作的。然而，这其实只是第一步。如果你照那个流程走，得到的仍然是锯齿状的结果。这些锯齿的<strong>真正</strong>原因，在于 `lxr` 的计算顺序。

```c
// 先乘，再移位到 .8（A 和 B）
    lxr= (120*lcf)>>4;

// 先移位到 .8，再乘（C）
    lxr= 120*(lcf>>4);
```

得到 `lxr` = *p*<sub>a/c</sub>·*x*<sub>s</sub> 需要两个部分：与 **P** 元素相乘，以及向下移位到 .8 定点数。你或许会以为最后再做移位更好，因为那样精度更高。有趣的是，它<strong>并非</strong>如此！在乘法<em>之前</em>先把 _p_<sub>a</sub> 或 _p_<sub>c</sub> 向下移位到 8 个小数位，才是消除残余失真的关键，颠倒运算顺序并不会。

至于为什么，我没有 100% 的把握，但我可以猜一猜。仿射变换是围绕屏幕原点进行的，而为了把原点放到别处，我们需要施加一个通过后平移 **x**<sub>s</sub> 完成的位移。我认为关键的一点是：**x**<sub>s</sub> 是屏幕空间中的一个点，使用的是普通整数，而非定点数。然而，它只适用于 _x_<sub>s</sub>，因为它<em>确实</em>代表一个屏幕上的偏移；而 _y_<sub>s</sub> 其实并不是屏幕上的一个点，而是摄像机的焦距。另一方面，这也可能与位移用的内部寄存器有关。

### 结论 {#ssec-order-verdict}

显然，类型 C 才是你想要的那个。我没能自己想到它，这着实让我抓狂。而事实上我曾用过那个缩放-旋转乘法、却因为我搞砸了与投影距离 _D_ 的乘法而把它抛弃了，这也无济于事（是的，这句话是有意义的）。上面展示的 `m7_hbl_c` 代码是有效的，尽管它只用了 32 位数学。只要你先做缩放-旋转乘法，并且在计算 `wxr` 里乘以 120 之前先向下移位到 .8 定点数，一切都会没问题。

## 最后的思考 {#sec-final}

这一次的情形再次表明：编程（尤其是底层编程）既是一门科学，也是一门艺术。尽管三种 Mode 7 版本的理论是相同的，但实现中计算顺序与精度的微小差异，却在最终结果上造成了非常明显的不同。说到 Mode 7，要先计算仿射矩阵，再做修正偏移。但最重要的是，屏幕的 _x_ 偏移量不应该用定点数来做。

其次，这还只是 Mode 7 图形背后的基础理论。没有精灵，没有俯仰角，也没有地平线，并且从一开始就是为 GBA 硬件量身定做的。在下一章中，我们将遵循标准的 3D 理论、借助线性代数，更详尽地推导出这套理论。那一章还会展示如何在 3D 中摆放精灵，以及如何对它们做其它处理，比如为旋转制作动画和排序，并且还会给出可变俯仰角和一个地平线。如果这听起来很复杂，嗯，我猜确实如此。不过，它绝对值得一看。
