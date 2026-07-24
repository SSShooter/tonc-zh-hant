# 21. Mode 7 第二部分

<!-- toc -->

## 简介 {#sec-intro}

[Mode 7 第一部分](mode7.html)介绍了如何把一个仿射背景变成看起来像 3D 平面的基本方法，并讨论了一些涉及定点数算术的棘手部分。让一个 3D 平面看起来正确只是第一步。

在本章中，我们将研究创建一个 3D 世界所涉及的一般数学，并将其转化为可用于 mode 7 的形式。这包括各个方向上的平移与环视（yaw，偏航），和之前一样，但还包含一个用于上下看的俯仰角（pitch）。我们还将看到如何处理地平线，并使用一个背景作为地平线上方的远景。我甚至会加入一点雾效，来遮挡地面上较远的部分。

我还会讨论如何在 3D 空间中使用精灵(对象)。不仅是从 3D 空间到 2D 屏幕的变换，还包括剔除（culling）、按距离缩放（这并不像想的那么简单）、动画与排序。请注意，本章这部分属于基础的 3D 精灵(对象)理论，可以应用于以某种方式使用精灵(对象)的 3D 游戏。

本章的理论部分会非常偏重数学，因为 3D 理论向来如此。懂一点[线性代数](matrix.html)肯定不会有害。完整的几何故事超出了 Tonc 的范围，但这些内容相当通用；大多数 3D 编程书籍都会有一章讲几何变换，所以如果你在这里有点迷糊，可以去查阅那些资料。

本章几乎涉及了到目前为止讲过的所有主题。它用到了[仿射对象](affobj.html)、背景（既有[常规](regbg.html)也有[仿射](affbg.html)）、[中断](interrupts.html)、[颜色特效](gfx.html#blend)以及更多。如果你对其中的任何一项理解不足，在这里可能会过得很艰难。

<div class="cblock">
    <table id="fig:img-m7-ex">
      <tbody align="center">
        <tr>
          <td><img src="img/mode7/m7_ex_00.png" alt="full mode 7"></td>
          <td><img src="img/mode7/m7_ex_01.png" alt="full mode 7"></td>
        </tr>
        <tr>
          <td colspan=2>
            <b>*@fig:img-m7-ex</b>: <tt>m7_ex</tt>; 包含地平线、精灵(对象)、可变俯仰角与距离雾效。
          </td>
        </tr>
      </tbody>
    </table>
</div>

我们要尝试做的是重现 SNES 超级马里奥赛车的场景（见 {@fig:img-m7-ex}；使用这些图形要向任天堂致歉，但我在这种情况下确实别无选择 <kbd>:\\</kbd>）。这只是游戏的一个定格画面，并不涉及实际玩法，但它应该能提供一个不错的模仿目标。代码分布在多个文件中：简单的 mode 7 函数放在 `mode7.c` 中，较复杂的 mode 7 函数与中断例程放在 `mode7.iwram.c` 中。演示专用代码可以在 `m7_ex.c` 中找到，它负责初始化、交互和主循环。基本操作如下：

<div class="lblock">
  <table cellpadding=2 cellspacing=0>
    <col span=2 align="left" valign="top">
      <tr><th>D-pad	<td>视角
      <tr><th>A/B		<td>后退/前进
      <tr><th>L/R		<td>平移
      <tr><th>Select+A/B	<td>上浮/下沉
      <tr><th>Start	<td>菜单
  </table>
</div>

移动和视角控制遵循 FPS/飞行器式的运动方式，或者至少在用现有按键数量所能达到的范围内如此。还有几个额外选项被放进了菜单。首先是_运动控制_（motion control），用于设定不同的移动方式。'local' 选项沿相机轴进行飞行控制，'level' 选项提供与地面平行的运动（如同通常的 FPS），而 'global' 选项使用世界轴进行移动。其他选项包括开关雾效以及重置演示程序。

## Mode 7 基础理论 {#sec-theory}

{*@fig:img-crd-overview} 展示了我们要面对的局面：我们有一个位于 **a**<sub>cw</sub> 的相机，它相对于世界坐标系有一定的朝向。我们要做的是找到将屏幕点 **x**<sub>s</sub> 与世界点 **x**<sub>w</sub> 联系起来的变换。有多种方法可以做到这一点。你已经在[第一个 mode 7 章节](mode7.html)中见过一种，当时我们从一开始就想着 GBA 硬件。你可以花点功夫把它扩展到一般的 mode 7 情形（非零俯仰角）。你也可以使用纯三角学，但那是个到处是负号和可能的正余弦混淆的雷区。尽管如此，它仍是可行的。不过，我在这里要使用的是[线性代数](matrix.html)。选择它有若干理由。首先，线性代数记号非常简洁，所以你可以用几行就写出最终解（事实上，一旦你理清定义，覆盖所有情形的解可以只用两行写出）。此外，方程结构良好、外观统一，便于调试。再就是，把整套东西求逆非常容易。最后，这也是真正的 3D 系统所用的方法，所以该理论也能应用于 mode 7 之外的领域。反过来，如果你懂基础 3D 理论，在这里也会感到得心应手。

<div class="lblock">
  <div class="cpt" style="width:378px;">
    <img src="img/mode7/crd_overview.png" id="fig:img-crd-overview" alt="overview">
    <br>
    <b>*@fig:img-crd-overview</b>: 基本的 3D 情形。关键在于将屏幕点 <b>x</b><sub>s</sub> 与世界点 <b>x</b><sub>w</sub> 联系起来，同时考虑相机位置 <b>a</b><sub>cw</sub> 及其朝向。
  </div>
</div>

### 定义 {#ssec-try-defs}

不过，在你做任何事之前，需要先确切地知道我们将使用什么。首先要说明的是，我们有两套主要的坐标系：<dfn>世界</dfn>坐标系 _S_<sub>w</sub> 与<dfn>相机</dfn>坐标系 _S_<sub>c</sub>。在相机坐标系内部，还有两个次级坐标系，即<dfn>投影</dfn>空间 _S_<sub>p</sub> 与<dfn>屏幕</dfn>空间 _S_<sub>s</sub>。现在，对于 _S_<sub>i</sub> 与 _S_<sub>j</sub> 两套系统之间的每一次变换，下面的关系都成立：

<table id="eq:crd-transf">
  <tr>
    <td class="eqnrcell">(!@eq:crd-transf)
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <msub>
                    <mi>M</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>i</mi>
                      <mi>j</mi>
                    </mrow>
                  </msub>
                  <mtext>&#xA0;</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext>&#xA0;</mtext>
                  <msub>
                    <mi>x</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>j</mi>
                    </mrow>
                  </msub>
                  <mo>=</mo>
                  <msub>
                    <mi>x</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>i</mi>
                    </mrow>
                  </msub>
                  <mo>&#x2212;</mo>
                  <msub>
                    <mi>a</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>j</mi>
                      <mi>i</mi>
                    </mrow>
                  </msub>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
</table>

where

<div class="lblock">
  <table cellpadding=0>
    <tr>
      <td><b>x</b><sub>i</sub>
      <td>系统 <i>S</i><sub>i</sub> 中的坐标向量；
    <tr>
      <td><b>x</b><sub>j</sub>
      <td>系统 <i>S</i><sub>j</sub> 中的坐标向量；
    <tr>
      <td><b>a</b><sub>ji</sub>
      <td>系统 <i>S</i><sub>j</sub> 的原点，用系统 <i>S</i><sub>i</sub> 的坐标表示；
    <tr>
      <td><b>M</b><sub>ij</sub>
      <td>变换矩阵，本质上是由 <i>S</i><sub>j</sub> 的主向量（以 <i>S</i><sub>i</sub> 表示）构成的矩阵。
  </table>
</div>

一旦你克服了看到这么多下标时的初次震惊（唔，在广义相对论里有个叫黎曼张量的东西，它有_四_个下标），你就会发现这个方程是有道理的。如果你不能立刻明白，就把它们想成数组和矩阵。细心的读者也会在[screen↔map transformation](affbg.html#sec-aff-ofs) 我们在仿射映射中见过：**P·q** = **p − dx**. 顺便说一下，{*@eq:crd-transf} 是一个非常通用的方程，它对任何种类的线性坐标变换都成立。事实上，系统 _S_<sub>i</sub> 和 _S_<sub>j</sub> 甚至不必具有相同的维数！

如前所述，我们一共有 4 个系统，因此有 4 个下标分别对应 <dfn>w</dfn>（orld，世界）、<dfn>c</dfn>（amera，相机）、<dfn>p</dfn>（rojection，投影）、<dfn>s</dfn>（creen，屏幕）。请记住它们，因为它们会非常高频率地出现。矩阵和原点的最终形式在很大程度上取决于这些系统的精确定义，所以务必清楚每一个的含义。

### 世界坐标系 {#ssec-try-world}

其中第一个，世界系统 _S_<sub>w</sub>，很好处理。它就是一个右手笛卡尔坐标系，主轴为 **i**、**j** 和 **k**，分别对应于它的 x、y、z 轴。在计算机图形学使用的右手系中，x 轴（**i**）指向右，y 轴（**j**）指向上，而 z 轴（**k**）指向_后方_！这意味着你是在朝负 _z_ 方向看，一开始可能觉得奇怪。如果你非要一个指向前方的 **k**，可以用左手系。虽然这会彻底毁掉我的 3D 直觉，但你想用就用吧。不过在这么做之前，请记住：地图标记的是世界空间的地面，而在右手系中，纹理坐标会整齐地对应到世界坐标。

### 相机坐标系 {#ssec-try-cam}

<div class="cpt_fr" style="width:260px;">
  <img src="img/mode7/crd_w2c.png" id="fig:img-w2c" alt="word to camera transformation">
  <br>
  <b>{*@fig:img-w2c}</b>: 相机朝向 {<b>u, v, w</b>}，处于世界空间 {<b>i, j, k</b>} 中，由角度 &theta; 和 &phi; 给出
</div>

到相机系统的变换大概是整件事的主要难点。至少，要不是有矩阵的话它本会如此。重写 @eq:crd-transf，相机与世界空间之间的变换由下式给出：

<table id="eq:w2c">
<tr>
   <td class="eqnrcell">({!@eq:w2c})
   <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mi>C</mi>
                <mtext>&#xA0;</mtext>
                <mo>&#x22C5;</mo>
                <mtext>&#xA0;</mtext>
                <msub>
                  <mi>x</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>c</mi>
                  </mrow>
                </msub>
                <mo>=</mo>
                <msub>
                  <mi>x</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>w</mi>
                  </mrow>
                </msub>
                <mo>&#x2212;</mo>
                <msub>
                  <mi>a</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>c</mi>
                    <mi>w</mi>
                  </mrow>
                </msub>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
</table>

正如你所料，相机空间的原点就是相机位置 **a**<sub>cw</sub>。相机矩阵 **C** 由相机空间的主轴构成，分别是局部 x、y、z 轴的 **u, v** 和 **w**。这意味着相机矩阵为 **C** = \[**u v w**\]。

相机相对于世界空间的朝向由 3 个角度定义：<dfn>pitch</dfn>（绕 x 轴旋转）、<dfn>yaw</dfn>（绕 y 轴旋转）和 <dfn>roll</dfn>（绕 z 轴旋转）。它们的组合给出 **C**。传统上，这些旋转的方向约定为：如果沿其中某轴向下看，正角度使系统逆时针转动。不过我会反其道而行，因为这样能让很多事情更简单。此外，我只会使用两个角度：pitch 和 yaw。对于 mode 7，不可能把 roll 纳入其中。为什么？这样想：如果你侧滚了身体，地面会出现在屏幕的右边或左边，这就需要垂直的透视除法，而由于我们只能在 HBlank 时改变仿射参数，这无法实现。因此，只允许 pitch (θ) 和 yaw (φ)。我希望正的 θ 和 φ 分别使视角向下和向右，也就是说我需要以下旋转矩阵：

<table id="eq:mat-rot">
  <tr>
    <td class="eqnrcell">({!@eq:mat-rot}a)</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <msub>
                    <mtext mathvariant="bold">R</mtext>
                    <mrow data-mjx-texclass="ORD">
                      <mi>x</mi>
                    </mrow>
                  </msub>
                  <mo stretchy="false">(</mo>
                  <mi>&#x3B8;</mi>
                  <mo stretchy="false">)</mo>
                  <mo>=</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mn>1</mn>
                        </mtd>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                        <mtd>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                        <mtd>
                          <mo>&#x2212;</mo>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
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
    </td>
  </tr>
  <tr>
    <td class="eqnrcell">({!@eq:mat-rot}b)</td>
    <td>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <msub>
                    <mtext mathvariant="bold">R</mtext>
                    <mrow data-mjx-texclass="ORD">
                      <mi>y</mi>
                    </mrow>
                  </msub>
                  <mo stretchy="false">(</mo>
                  <mi>&#x3C6;</mi>
                  <mo stretchy="false">)</mo>
                  <mo>=</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                        <mtd>
                          <mo>&#x2212;</mo>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                        <mtd>
                          <mn>1</mn>
                        </mtd>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                        <mtd>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
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
    </td>
  </tr>
</table>

但接下来出现了一个问题：我们先做俯仰（pitch）还是先做偏航（yaw）？这真的取决于你想要什么样的效果，_以及_你是在哪个坐标系下做旋转。实际上，由于不允许滚转（roll）的同样原因，只有一种顺序是可行的：你不能有垂直的透视。这归根结底意味着 **u**（相机坐标系的 x 轴）_必须_平行于地平面，即 _u_<sub>y</sub> 必须为零。为了做到这一点，你必须先做俯仰，再做偏航。这一点在 {@fig:img-w2c} 中有所描绘。找找感觉：站起来，低下头（pitch θ\>0），然后向右转（yaw φ\>0）。于是完整的相机矩阵就变为：

<table id="eq:rotxy">
  <tr>
    <td class="eqnrcell">({!@eq:rotxy})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">C</mtext>
                  <mo stretchy="false">(</mo>
                  <mi>&#x3B8;</mi>
                  <mo>,</mo>
                  <mi>&#x3C6;</mi>
                  <mo stretchy="false">)</mo>
                  <mo>=</mo>
                  <msub>
                    <mtext mathvariant="bold">R</mtext>
                    <mrow data-mjx-texclass="ORD">
                      <mi>y</mi>
                    </mrow>
                  </msub>
                  <mo stretchy="false">(</mo>
                  <mi>&#x3C6;</mi>
                  <mo stretchy="false">)</mo>
                  <mtext>&#xA0;</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext>&#xA0;</mtext>
                  <msub>
                    <mtext mathvariant="bold">R</mtext>
                    <mrow data-mjx-texclass="ORD">
                      <mi>x</mi>
                    </mrow>
                  </msub>
                  <mo stretchy="false">(</mo>
                  <mi>&#x3B8;</mi>
                  <mo stretchy="false">)</mo>
                  <mo>=</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                          <mo>&#x22C5;</mo>
                          <mi>s</mi>
                          <mi>i</mi>
                          <mi>n</mi>
                          <mo stretchy="false">(</mo>
                          <mi>&#x3B8;</mi>
                          <mo stretchy="false">)</mo>
                        </mtd>
                        <mtd>
                          <mo>&#x2212;</mo>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                          <mo>&#x22C5;</mo>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mn>0</mn>
                        </mtd>
                        <mtd>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mo>&#x2212;</mo>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                          <mo>&#x22C5;</mo>
                          <mi>sin</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mtd>
                        <mtd>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3C6;</mi>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                          <mo>&#x22C5;</mo>
                          <mi>cos</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mi>&#x3B8;</mi>
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
    </td>
</table>

除了正确之外，这个矩阵还有两个很好的性质。首先，列向量都是单位长度的。其次，各分量向量彼此正交。这意味着 **C** 是一个<dfn>正交矩阵</dfn>，它有一个非常好的特性：**C**<sup>−1</sup> = **C**<sup>T</sup>。这使得世界→相机的变换成为一个相对简单的操作。

这里最后还有一件事：如果你把相机系统绕 **i** 旋转 180°，就会得到一个指向前方的 **w** 和一个指向下的 **v**，这两者都能减少后续计算中别扭的负号数量，代价是一个别扭的相机坐标系。你是否愿意这么做，取决于你自己。

:::note 矩阵变换及其所在的系统

我说过，要模仿 **C** 的旋转，你得先低头（θ），再转动身体（φ）。你也许认为反着做能得到同样的效果：先转，再低头。然而，这是不正确的。

它可能_感觉_一样，但在第二种情况下，你实际上并没有用 **R**<sub>x</sub>(θ) 来引发低头。矩阵本身不是个东西，它‘活’在一个空间里。这里，**R**<sub>x</sub>(θ) 和 **R**<sub>y</sub>(φ) 都是用_世界_坐标系定义的，应用它们时方向遵循世界的轴。先转后低的顺序会在局部坐标系中用 **R**<sub>x</sub>(θ)，那是个合法操作，但不是数学所要求的那个。

我知道这是个微妙的点，但确实有重要差别。试着用两种顺序各做一个 90° 旋转来可视化，也许会有帮助。

:::

### 投影平面 {#ssec-try-proj}

<div class="cpt_fr" style="width:256px;">
  <img src="img/mode7/crd_c2p.png" id="fig:img-c2p" alt="">
  <br>
  <b>{*@fig:img-c2p}</b>: perspective projection.
</div>

为了制造深度的错觉，我们需要一个<dfn>透视视图</dfn>。为此，你需要一个<dfn>投影中心</dfn>（COP）和一个<dfn>投影平面</dfn>。自然，这两者都必须位于相机空间中。虽然你可以任意选择它们，但你可以把投影中心放在相机空间的原点、把投影平面放在相机前方距离 _D_ 处，这样平面就由 **x**<sub>p</sub> = (_x_<sub>p</sub>, *y*<sub>p</sub>, −*D*) 给出。是的，那是负的 _z_<sub>p</sub>，因为我们是在朝负 z 方向看。投影坐标是 COP 与 **x**<sub>c</sub> 连线和投影平面的交点。由于 COP 在原点，**x**<sub>c</sub> 和 **x**<sub>p</sub> 之间的关系是

<table id="eq:c2p">
<tr>
  <td class="eqnrcell">({!@eq:c2p})</td>
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mi>&#x3BB;</mi>
                <mtext>&#xA0;</mtext>
                <msub>
                  <mi>x</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>p</mi>
                  </mrow>
                </msub>
                <mo>=</mo>
                <msub>
                  <mi>x</mi>
                  <mi>c</mi>
                </msub>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
    </td>
</table>

这里的 λ 是一个简单的缩放因子，它的值可以用多种方法确定，取决于你在推导的该点处掌握的信息。例如，由于 _z_<sub>p</sub> = −*D*（按定义），我们有 λ = −*z*<sub>c</sub> / _D_。稍后我们会看到另一个表达式。这个表达式有趣的地方在于，λ 与相机空间中的距离成正比，而这又告诉你相机位置应该被缩放_ down_（即缩小）多少，或者说缩放了多少。这很有用，因为仿射矩阵的缩放参数同样会缩小。此外，距离 _D_ 会衰减缩放，这意味着它起到了<dfn>焦距</dfn>的作用。注意，当 _z_<sub>c</sub> = −*D* 时，缩放为 1，意味着处在这个距离上的物体以正常大小出现。

### 视口与可视体 {#ssec-try-view}

<div class="cpt_fr" style="width:308px;">
  <img src="img/mode7/viewport.png" id="fig:img-viewport" alt="">
  <br>
  <b>{*@fig:img-viewport}</b>: Viewing frustum in camera space. The green rectangle is the visible part of the projection plane (i.e., the screen).
</div>

在我给出到屏幕的最后一步变换之前，我得先说几句关于视口和可视体的话。可以想象，你只能看到世界的一小部分。你是通过一个叫做<dfn>视口</dfn>的区域来观察世界的。它是投影平面上的一个区域，通常是矩形，定义了你能看到的水平和垂直边界。具体来说，你有左边 (_L_)、右边 (_R_)、上边 (_T_) 和下边 (_B_)。在坐标轴如上定义、且原点通常位于中心的情况下（见 @fig:img-viewport 插图），我们有 _R\>0\>L_ 且 _T\>0\>B_。没错，在这个特定情形下 _L_ 是负的，而 _T_ 是正的！

视口的宽度和高度分别为 *W* = \|_R−L_\| 和 *H* = \|_B−T_\|。视口与投影中心一起定义了<dfn>可视体</dfn>（见 @fig:img-viewport）。对于矩形视口，这将是一个棱锥。

大多数时候你还会想要在深度上设置边界，因为太近的物体会挡住其他一切（此外，除以 0 从来都不是什么好事），而非常远的物体会变得极小，几乎看不见，何必在区区几个像素上浪费这么多计算？这些深度边界叫做<dfn>近</dfn>平面 (_N_) 和<dfn>远</dfn>平面 (_F_)，它们会把可视体变成一个截头体（frustum）。这些距离的具体数值可以凭喜好而定。无论你用什么值，都要记住 z 值实际上是负的。我更倾向于让 _N_ 和 _F_ 取正值，这样距离的顺序为 0\>−*N*\>−*F*。

另一点是<dfn>视场角</dfn>（FOV）的概念。这是你能看到的水平角度 α，也就是说

<table id="eq:fov-cam">
  <tr>
    <td class="eqnrcell">({!@eq:fov-cam})
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>tan</mi>
                  <mo data-mjx-texclass="NONE">&#x2061;</mo>
                  <mrow>
                    <mo data-mjx-texclass="OPEN">(</mo>
                    <mi>&frac12; &#x3B1;</mi>
                    <mo data-mjx-texclass="CLOSE">)</mo>
                  </mrow>
                  <mo>=</mo>
                  <mfrac>
                    <mi>&frac12; W</mi>
                    <mi>D</mi>
                  </mfrac>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
</table>

我听说常用的 FOV 大约是 90°，那将要求 *D* = ½*W*。取 *D* = 128 就相当接近这个要求，而且还有它是 2 的幂的额外好处，不过那当然是个实现细节。_然而_，似乎 *D* = 256 更常见，所以我们改用这个值。

### 屏幕 {#ssec-try-scr}

<div class="cpt_fr" style="width:192px;">
  <img src="img/mode7/crd_p2s.png" id="fig:img-p2s" alt="">
  <br>
  <b>{*@fig:img-p2s}</b>: screen space vs camera space
</div>

最后一步是从投影平面到屏幕。这一步几乎微不足道，但那个“几乎”如果不小心会给你带来大麻烦。情形如 @fig:img-p2s 所示，你正透过相机观察。轴 **u** 和 **v** 是相机系统的上轴和右轴，而绿色箭头表示屏幕空间的 x 轴和 y 轴。如果你留意过任何一个教程，你应该知道屏幕的 y 轴指向_下_。这是头号 bug 源。此外，相机空间和屏幕空间的原点也不同。由于屏幕对应于视口，屏幕在相机/投影空间中的原点是 **a**<sub>sp</sub> = (_L, *T*, −*D*)。注意不要在这里把符号弄反，那是二号 bug 源。还要记住，由于这是在相机空间中，_L_ 是负的而 _T_ 是正的。考虑到垂直轴翻转以及屏幕空间原点，我们有

<table id="eq:p2s">
  <tr>
    <td class="eqnrcell">({!@eq:p2s})
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>S</mi>
                  <mo stretchy="false">(</mo>
                  <mn>1</mn>
                  <mo>,</mo>
                  <mo>&#x2212;</mo>
                  <mn>1</mn>
                  <mo>,</mo>
                  <mn>1</mn>
                  <mo stretchy="false">)</mo>
                  <mo>&#x22C5;</mo>
                  <msub>
                    <mi>x</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>s</mi>
                    </mrow>
                  </msub>
                  <mo>=</mo>
                  <msub>
                    <mi>x</mi>
                    <mi>p</mi>
                  </msub>
                  <mo>&#x2212;</mo>
                  <msub>
                    <mi>a</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>s</mi>
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

缩放矩阵把 y 轴的符号翻转了。如果我们把相机坐标系再旋转 180°，本可省掉这个额外的矩阵，那样 **v** 会指向下而 **w** 会指向前。但我没有这么做，所以我们只能将就。另外，由于屏幕在相机空间中的原点是 **a**<sub>sp</sub> = (_L, *T*, −*D*)，屏幕位置为 **x**<sub>s</sub> = (_x_<sub>s</sub>, *y*<sub>s</sub>, 0)，换句话说 _z_<sub>s</sub> 始终为零。如果你要检查一切是否正常，看看视口的各个角是否给出正确的屏幕坐标即可。

### 理论小结 {#ssec-try-sum}

基本上就是这样了，呼。既然花了三页才到这里，我把最重要的东西重复一遍。首先，我们需要的主要方程是：

<table id="eq:m7-main">
<col span=2 align="right">
<tr>
  <td class="eqnrcell">({!@eq:m7-main}a)</td>
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mi>&#x3BB;</mi>
                <mi>C</mi>
                <mtext>&#xA0;</mtext>
                <mo>&#x22C5;</mo>
                <mtext>&#xA0;</mtext>
                <msub>
                  <mi>x</mi>
                  <mi>p</mi>
                </msub>
                <mo>=</mo>
                <msub>
                  <mi>x</mi>
                  <mi>w</mi>
                </msub>
                <mo>&#x2212;</mo>
                <msub>
                  <mi>a</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>c</mi>
                    <mi>w</mi>
                  </mrow>
                </msub>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
  </td>
</tr>
<tr>
  <td class="eqnrcell">({!@eq:m7-main}b)</td>
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mi>S</mi>
                <mo stretchy="false">(</mo>
                <mn>1</mn>
                <mo>,</mo>
                <mo>&#x2212;</mo>
                <mn>1</mn>
                <mo>,</mo>
                <mn>1</mn>
                <mo stretchy="false">)</mo>
                <mo>&#x22C5;</mo>
                <msub>
                  <mi>x</mi>
                  <mi>s</mi>
                </msub>
                <mo>=</mo>
                <mo stretchy="false">(</mo>
                <msub>
                  <mi>x</mi>
                  <mi>p</mi>
                </msub>
                <mo>&#x2212;</mo>
                <msub>
                  <mi>a</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>s</mi>
                    <mi>p</mi>
                  </mrow>
                </msub>
                <mo stretchy="false">)</mo>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
  </td>
</table>

其中

<div class="lblock">
  <table cellpadding=0>
    <tr>
      <td width="8%"><b>x</b><sub>w</sub>
      <td>coordinates in world space;
    <tr>
      <td><b>x</b><sub>p</sub>
      <td> coordinates on the projection plane, <b>x</b><sub>p</sub>=
      (<i>x</i><sub>p</sub>, <i>y</i><sub>p</sub>, &minus;<i>D</i>);
    <tr>
      <td><b>x</b><sub>s</sub>
      <td>coordinates on the screen, <b>x</b><sub>s</sub>=
      (<i>x</i><sub>s</sub>, <i>y</i><sub>s</sub>, 0);
    <tr>
      <td><b>a</b><sub>cw</sub>
      <td>the location of the camera in world space;
    <tr>
      <td><b>a</b><sub>sp</sub>
      <td>the location of the screen origin in camera space space,
      <b>a</b><sub>sp</sub>&nbsp;=&nbsp;(<i>L, T, &minus;D</i>);
    <tr>
      <td><b>C</b>
      <td>the camera matrix, as function of pitch &theta; and yaw &phi;:
      <b>C</b> =
      <b>R</b><sub>y</sub>(&phi;)· <b>R</b><sub>x</sub>(&theta;);
    <tr>
      <td>&lambda;
      <td>the scaling factor. Its value can be determined by the
      boundary conditions.
  </table>
</div>

记住这些方程和术语，因为我以后会经常提到它们。{@eq:m7-main}a 和 {@eq:m7-main}b 之间的划分是刻意的：所有真实的信息都在 {@eq:m7-main}a 中；{@eq:m7-main}b 只是为完成变换而需要走的最后一步。在余下的文字中，我会频繁使用 {@eq:m7-main}a，除非必要，否则略去 {@eq:m7-main}b。其他值得了解的内容有：

- 世界坐标系 _S_<sub>w</sub> = {**i**,**j**,**k**} 与相机坐标系 _S_<sub>c</sub> = {**u**, **v**, **w**} 是右手笛卡尔坐标系。正如预期，相机矩阵 **C** 的列就是 _S_<sub>c</sub> 的主轴：**C** = \[**u v w**\]；
- 视口与可视体都位于相机坐标系中，这意味着它们的边界也同样如此。也就是说：
  <table>
    <tr><td><i>R</i> &gt; 0 &gt; <i>L</i> <td>(horizontal)
    <tr><td><i>T</i> &gt; 0 &gt; <i>B</i> <td>(vertical)
    <tr><td>0 &gt; &minus;<i>N</i> &gt; &minus;<i>F</i> <td>(depth)
  </table>
- 如果我们以 GBA 屏幕尺寸为基础（*W* = 240，*H* = 160），并取 *D* = 256，那么可视体边界的合理取值如下，不过你也可以另选。
  <table>
    <col span=1>
      <tr><td><i>L</i> = &minus;120  <td><i>R</i> = &minus;120
      <tr><td><i>T</i> =  80   <td><i>B</i> = &minus;80
      <tr><td><i>N</i> =  24   <td><i>F</i> = 1024
  </table>

## 地平线与远景 {#sec-horz}

拿最基本的 mode 7 情形来说：一个透视中的地面。由于透视除法，地面远处会趋近于一条线：<dfn>地平线</dfn>。由于地图实际上只是一块地面，地平线确实就只是那样：一条水平线。它上方的空间通常是空的，但为了让画面不那么单调，我们会使用一个<dfn>远景</dfn>：一幅随相机旋转而移动的深景环境全景图。

### 寻找地平线 {#sec-horz-find}

粗略地说，地平线就是 z = −∞ 所在之处。如果你在地面上有一些线，地平线就是所有平行线看似交汇的地方：灭线（vanishing line）。自然，如果你只有一块地面，那么你应该只在地平线下方绘制它，其上方的图形应该属于天空盒（skybox）。我确信你在原版马里奥赛车以及其他 mode 7 赛车游戏中见过这个。由于我们被限制在无滚转的相机，地平线永远是一条水平线：一条扫描线 _y_<sub>s,h</sub>。要找到它，我们只需取 {@eq:m7-main}a 的 _y_ 分量，并重新排列项，得到

<table id="eq:horz-line">
<tr>
  <td class="eqnrcell">({!@eq:horz-line}a)
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                  <mtr>
                    <mtd>
                      <mi>&#x3BB;</mi>
                      <mo stretchy="false">(</mo>
                      <msub>
                        <mi>v</mi>
                        <mi>y</mi>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <msub>
                        <mi>y</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>p</mi>
                          <mo>,</mo>
                          <mi>h</mi>
                        </mrow>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>w</mi>
                        <mi>y</mi>
                      </msub>
                      <mi>D</mi>
                      <mo stretchy="false">)</mo>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mi>w</mi>
                          <mo>,</mo>
                          <mi>y</mi>
                        </mrow>
                      </msub>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd style="text-align: left;">
                      <msub>
                        <mi>y</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>p</mi>
                          <mo>,</mo>
                          <mi>h</mi>
                        </mrow>
                      </msub>
                    </mtd>
                    <mtd>
                      <mi></mi>
                      <mo>=</mo>
                      <mo stretchy="false">(</mo>
                      <msub>
                        <mi>w</mi>
                        <mi>y</mi>
                      </msub>
                      <mi>D</mi>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mi>w</mi>
                          <mo>,</mo>
                          <mi>y</mi>
                        </mrow>
                      </msub>
                      <mrow data-mjx-texclass="ORD">
                        <mo>/</mo>
                      </mrow>
                      <mi>&#x3BB;</mi>
                      <mo stretchy="false">)</mo>
                      <mrow data-mjx-texclass="ORD">
                        <mo>/</mo>
                      </mrow>
                      <msub>
                        <mi>v</mi>
                        <mi>y</mi>
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

如果我们把地平线取在无穷远处，则 λ = −∞，这会令 @eq:horz-line 简化为

<table>
<tr>
  <td class="eqnrcell">({!@eq:horz-line}b)
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
                    <mi>p</mi>
                    <mo>,</mo>
                    <mi>h</mi>
                  </mrow>
                </msub>
                <mo>=</mo>
                <mi>D</mi>
                <mtext>&#xA0;</mtext>
                <msub>
                  <mi>w</mi>
                  <mi>y</mi>
                </msub>
                <mrow data-mjx-texclass="ORD">
                  <mo>/</mo>
                </mrow>
                <msub>
                  <mi>v</mi>
                  <mi>y</mi>
                </msub>
                <mo>=</mo>
                <mi>D</mi>
                <mi>tan</mi>
                <mo data-mjx-texclass="NONE">&#x2061;</mo>
                <mrow>
                  <mo data-mjx-texclass="OPEN">(</mo>
                  <mi>&#x3B8;</mi>
                  <mo data-mjx-texclass="CLOSE">)</mo>
                </mrow>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
</table>

不过，你需要考虑是否要使用这个简化方程。在非常大的 λ 下，显示出的地图点之间的间隔如此之大，以至于你实际上在显示噪声，那会非常难看。更好的办法是利用远裁剪面 _z_<sub>c</sub> = −*F*。此时 λ = *F/D*，我们可以用 @eq:horz-line 来计算地平线，结果大致是

<table>
<tr>
  <td class="eqnrcell">({!@eq:horz-line}c)
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
                    <mi>p</mi>
                    <mo>,</mo>
                    <mi>h</mi>
                  </mrow>
                </msub>
                <mo>=</mo>
                <mi>D</mi>
                <mrow data-mjx-texclass="ORD">
                  <mo>/</mo>
                </mrow>
                <mi>F</mi>
                <mtext>&#xA0;</mtext>
                <mo>&#x22C5;</mo>
                <mtext>&#xA0;</mtext>
                <mo stretchy="false">(</mo>
                <mi>F</mi>
                <msub>
                  <mi>w</mi>
                  <mi>y</mi>
                </msub>
                <mtext>&#xA0;</mtext>
                <mo>&#x2212;</mo>
                <mtext>&#xA0;</mtext>
                <msub>
                  <mi>a</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mi>c</mi>
                    <mi>w</mi>
                    <mo>,</mo>
                    <mi>y</mi>
                  </mrow>
                </msub>
                <mo stretchy="false">)</mo>
                <mrow data-mjx-texclass="ORD">
                  <mo>/</mo>
                </mrow>
                <msub>
                  <mi>v</mi>
                  <mi>y</mi>
                </msub>
              </mtd>
            </mtr>
          </mtable>
        </mrow>
      </mstyle>
    </math>
</table>

正如所料，如果 *F* = −∞，那么 {@eq:horz-line}c 就简化为 {@eq:horz-line}b。无论你选择有限的还是无限的 _z_<sub>c</sub>，地平线都会位于扫描线 _y_<sub>s,h</sub> = *T − y*<sub>p,h</sub>。

### 使用地平线 {#ssec-horz-use}

地平线标出了地图与“远在天边”之间的界线：地面与远景的分界。地面显然应该是一个仿射背景；至于远景，我们会用一个常规背景，尽管那并非必须。我们需要一种方法，能在地平线扫描线处切换这两者。最简单的方法是通过 HBlank 中断：一旦到达地平线扫描线，就在 BG 控制寄存器中切换地面与远景的设置，并且如果你选择用 DMA 来做，可能还要启动 HDMA 来传送仿射参数。

在远景背景和地面背景之间切换，其实比听起来更棘手。例如，你可以为两者各用一个独立的背景，并根据需要启用/禁用它们。问题在于，似乎要让一个背景在硬件中完全就绪大约需要 3 条扫描线（见 [forum:1303](https://gbadev.net/forum-archive/thread/4/1303.html)），所以那段时间你会看到垃圾内容。换句话说，这个方案不行。

另一种办法是让两者共用一个背景，并把视频模式从 0 切换到 1 或 2。这不会给你 3 行垃圾，但另一个问题出现了：远景和地面的图块与地图属性极有可能截然不同。不过这很容易解决：只需在 `REG_BGxCNT` 中改变屏幕（以及字符）基块即可。

<div class="lblock">
  <div class="cpt" style="width:336px;">
    <img src="img/mode7/bg_switch.png" id="fig:img-bg-switch" alt="bg-switch">
    <br>
    <b>{*@fig:img-bg-switch}</b>: Switch video-mode and background parameters at the horizon.
  </div>

  <div class="cpt" style="width:450px;">
    <img src="img/mode7/panorama.png" id="fig:img-pan" alt="panorama" width=450>
    <br>
    <b>{*@fig:img-pan}</b>: peeling a panoramic view from a cylinder.
  </div>
</div>

### 制作并放置远景 {#ssec-horz-backdrop}

地平线正上方的空间留给远景。你大概想要一张远处城镇或树线的漂亮图片放在那里，而不是一片无聊的空天空。远景提供的是一幅全景视图，可以把它看作画在一个圆柱内壁上、再剥下来铺到普通 2D 表面上的地图（见 @fig:img-pan）。思路是把那个表面放到一个背景上，并让它滚动起来。

在垂直方向上，背景的底部应该与地平线相接。由于常规背景使用环绕坐标，这其实相当容易：把远景的地面高度放在一个屏幕块的底部，并把垂直偏移设为 −*y*<sub>s,h</sub>。

在水平方向上，有若干问题需要注意。第一个是地图的宽度，也就是圆柱的周长 _P_。由于我们每旋转 360° 应当滚动一整张地图的宽度，所以每单位角度正确的滚动比例就是 _P_/2π = *R*，即半径。原则上 _R_ 是任意的，但当全景图的角度视场（α<sub>p</sub> = *W*/_R_）等于 @eq:fov-cam 中的相机视场角 α<sub>c</sub> 时，效果最好。如果一切正确，我们应当有 α<sub>p</sub> = α<sub>c</sub> = α。

<table id="eq:fov">
<tr>
  <td class="eqnrcell">({!@eq:fov})
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                  <mtr>
                    <mtd>
                      <mi>&#x3B1;</mi>
                    </mtd>
                    <mtd>
                      <mi></mi>
                      <mo>=</mo>
                      <mn>2</mn>
                      <mtext>&#xA0;</mtext>
                      <mo>&#x22C5;</mo>
                      <mtext>&#xA0;</mtext>
                      <mi>arctan</mi>
                      <mo data-mjx-texclass="NONE">&#x2061;</mo>
                      <mrow>
                        <mo data-mjx-texclass="OPEN">(</mo>
                        <mfrac>
                          <mi>&frac12; W</mi>
                          <mrow>
                            <mi>D</mi>
                          </mrow>
                        </mfrac>
                        <mo data-mjx-texclass="CLOSE">)</mo>
                      </mrow>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>&#x3B1;</mi>
                    </mtd>
                    <mtd style="text-align: left">
                      <mi></mi>
                      <mo>=</mo>
                      <mfrac>
                        <mi>W</mi>
                        <mi>R</mi>
                      </mfrac>
                      <!-- <mrow data-mjx-texclass="ORD">
                        <mo>/</mo>
                      </mrow>
                      <mi>R</mi> -->
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>R</mi>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <mfrac>
                        <mi>&frac12; W</mi>
                        <mrow>
                          <mi>arctan</mi>
                          <mo data-mjx-texclass="NONE">&#x2061;</mo>
                          <mrow>
                            <mo data-mjx-texclass="OPEN">(</mo>
                            <mfrac>
                              <mi>&frac12; W</mi>
                              <mi>D</mi>
                            </mfrac>
                            <mo data-mjx-texclass="CLOSE">)</mo>
                          </mrow>
                        </mrow>
                      </mfrac>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd></mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>&#x2248;</mo>
                      <mfrac>
                        <mi>D</mi>
                        <mrow>
                          <mn>1</mn>
                          <mo>&#x2212;</mo>
                          <mo stretchy="false">(</mo>
                          <mfrac>
                            <mi>&frac12; W</mi>
                            <mi>D</mi>
                          </mfrac>
                          <msup>
                            <mo stretchy="false">)</mo>
                            <mn>2</mn>
                          </msup>
                          <mtext>&#xA0;</mtext>
                          <mrow data-mjx-texclass="ORD">
                            <mo>/</mo>
                          </mrow>
                          <mtext>&#xA0;</mtext>
                          <mn>3</mn>
                        </mrow>
                      </mfrac>
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

最后一个近似来自反正切的[泰勒级数](https://en.wikipedia.org/wiki/Taylor's_theorem)的头几项。有趣的是，即便 _R_ ≈ _D_ 看起来也还算过得去。无论如何，代入 *W* = 240 和 *D* = 256 会得到 *P* = 1720，这可不是个方便的地图尺寸，对吧？现在，创建一个任意大小的地图并在超出屏幕块边界时更新 VRAM 是可行的（商业游戏一直都这么做），但那样会偏离手头的主题，所以你知道吗？我们稍微破坏一下规则，直接强制 *P* = 1024。

“等等……你不能那么干！”嗯，实际上我能。我不_应该_那么干，但那是另一回事。关键在于，我不认为有_任何_一个 mode 7 游戏正确地滚动了远景！例如，马里奥赛车经常在它们的远景中使用以不同速度滚动的多个背景，从数学上讲这绝对荒谬，因为环视并不会改变相对的视线方向。但我想没人注意到，或者至少没人在乎。我想说的是：我们这么做并不孤单 <kbd>:P</kbd>

所以，我们只是自己定义一个周长值以及由此得到的远景地图宽度。在这个例子里，我要用 *P* = 1024，这是个很整的数，用它时一个 512 像素宽的图块地图实际上会最终成为一个具有 180° 旋转对称性的全景图。考虑到圆的划分 2π ⇔ 10000h，滚动值就是简单地 φ*_P_/10000h = φ/64。我们还得用 _L_ 来偏移它，因为我想让 φ = 0 对应正北。远景的最终位置由 {!@eq:bd-pos} 给出。

<table id="eq:bd-pos">
<tr>
  <td class="eqnrcell">({!@eq:bd-pos})
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                  <mtr>
                    <mtd>
                      <mi>d</mi>
                      <mi>x</mi>
                    </mtd>
                    <mtd>
                      <mi></mi>
                      <mo>=</mo>
                      <mi>&#x3C6;</mi>
                      <mrow data-mjx-texclass="ORD">
                        <mo>/</mo>
                      </mrow>
                      <mn>64</mn>
                      <mo>+</mo>
                      <mi>L</mi>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>d</mi>
                      <mi>y</mi>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>y</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>s</mi>
                          <mo>,</mo>
                          <mi>h</mi>
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

## 地面 {#sec-flr}

### 地面的仿射参数 {#ssec-flr-parms}

{*@eq:m7-main} 描述了世界↔屏幕变换，但那其中的信息使用的是 3D 向量，而 GBA 只有一个 2×2 的仿射矩阵 **P** 和一个 2D 位移向量 **dx** 可用。所以我们需要做一些改写。现在，我可以把完整的推导、2D↔3D 转换等等都给你，但有些东西告诉我你真的不想看到那些。所以，我改为给你一组需要求解的方程，并提示如何求解。

<table id="eq:m7-set">
<tr>
  <td class="eqnrcell">({!@eq:m7-set})
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                  <mtr>
                    <mtd>
                      <mi>&#x3BB;</mi>
                      <mi>C</mi>
                      <mtext>&#xA0;</mtext>
                      <mo>&#x22C5;</mo>
                      <mtext>&#xA0;</mtext>
                      <msub>
                        <mi>x</mi>
                        <mi>p</mi>
                      </msub>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <msub>
                        <mi>x</mi>
                        <mi>w</mi>
                      </msub>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mi>w</mi>
                        </mrow>
                      </msub>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>S</mi>
                      <mo stretchy="false">(</mo>
                      <mn>1</mn>
                      <mo>,</mo>
                      <mo>&#x2212;</mo>
                      <mn>1</mn>
                      <mo>,</mo>
                      <mn>1</mn>
                      <mo stretchy="false">)</mo>
                      <mtext>&#xA0;</mtext>
                      <mo>&#x22C5;</mo>
                      <mtext>&#xA0;</mtext>
                      <msub>
                        <mi>x</mi>
                        <mi>s</mi>
                      </msub>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <mo stretchy="false">(</mo>
                      <msub>
                        <mi>x</mi>
                        <mi>p</mi>
                      </msub>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>s</mi>
                          <mi>p</mi>
                        </mrow>
                      </msub>
                      <mo stretchy="false">)</mo>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>P</mi>
                      <mtext>&#xA0;</mtext>
                      <mo>&#x22C5;</mo>
                      <mtext>&#xA0;</mtext>
                      <mi>q</mi>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <mi>p</mi>
                      <mo>&#x2212;</mo>
                      <mi>d</mi>
                      <mi>x</mi>
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

前两式其实只是 {@eq:m7-main} 的再次罗列，我列出来只是为了完整。最后一式是仿射映射下屏幕点 **q** 与地图点 **p** 之间的关系，这个式子你现在应该已经很熟悉了。现在请记住，我们的地图位于地面上，也就是说 **p** = (_x_<sub>w</sub>, *z*<sub>w</sub>)。二维屏幕点 **q** 自然与三维屏幕向量 **x**<sub>s</sub> 类似。你唯一需要记住的是，向 `REG_BGxY` 写入时，当前扫描线的最左端被当作原点，因此实际上 **q** = (_x_<sub>s</sub>, 0)，这反过来意味着 _p_<sub>b</sub> 和 _p_<sub>d</sub> 不起作用。矩阵 **P** 其余各元素的值，不过就是缩放后的相机 x 轴 λ**u** 的 _x_ 分量和 _z_ 分量。如果你使用这些值，最终会得到一个可以用下面这句话来概括的表达式：

<table id="eq:m7-ofs">
<tr>
  <td class="eqnrcell">({!@eq:m7-ofs})
  <td class="eqcell">
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                  <mtr>
                    <mtd>
                      <mi>d</mi>
                      <msup>
                        <mi>x</mi>
                        <mo data-mjx-alternate="1">&#x2032;</mo>
                      </msup>
                      <mo>=</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mi>w</mi>
                        </mrow>
                      </msub>
                      <mo>+</mo>
                      <mi>&#x3BB;</mi>
                      <mi>C</mi>
                      <mtext>&#xA0;</mtext>
                      <mo>&#x22C5;</mo>
                      <mtext>&#xA0;</mtext>
                      <mi>b</mi>
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

where

<div class="lblock">
  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
    <mstyle displaystyle="true" scriptlevel="0">
      <mrow data-mjx-texclass="ORD">
        <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
          <mtr>
            <mtd>
              <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                <mtr>
                  <mtd>
                    <mi>d</mi>
                    <msup>
                      <mi>x</mi>
                      <mo data-mjx-alternate="1">&#x2032;</mo>
                    </msup>
                  </mtd>
                  <mtd style="text-align: left;">
                    <mi></mi>
                    <mo>=</mo>
                    <mo stretchy="false">(</mo>
                    <mi>d</mi>
                    <mi>x</mi>
                    <mo>,</mo>
                    <mtext>&#xA0;</mtext>
                    <mn>0</mn>
                    <mo>,</mo>
                    <mtext>&#xA0;</mtext>
                    <mi>d</mi>
                    <mi>y</mi>
                    <mo stretchy="false">)</mo>
                  </mtd>
                </mtr>
                <mtr>
                  <mtd>
                    <mi>b</mi>
                  </mtd>
                  <mtd>
                    <mi></mi>
                    <mo>=</mo>
                    <mo stretchy="false">(</mo>
                    <mi>L</mi>
                    <mo>,</mo>
                    <mtext>&#xA0;</mtext>
                    <mi>T</mi>
                    <mo>&#x2212;</mo>
                    <msub>
                      <mi>y</mi>
                      <mrow data-mjx-texclass="ORD">
                        <msup>
                          <mi>s</mi>
                          <mo data-mjx-alternate="1">&#x2032;</mo>
                        </msup>
                      </mrow>
                    </msub>
                    <mo>,</mo>
                    <mo>&#x2212;</mo>
                    <mi>D</mi>
                    <mo stretchy="false">)</mo>
                  </mtd>
                </mtr>
              </mtable>
            </mtd>
          </mtr>
        </mtable>
      </mrow>
    </mstyle>
  </math>
</div>

你做位移所需的一切都整齐地打包进了这一个方程，现在我们需要把它拆开，以构造算法。首先，我们可以用 **dx'** 的 _y_ 分量来计算 λ。一旦有了它，我们就能用它来计算另外两个元素，即真正的仿射偏移。仿射矩阵前面已经给出过了。

{*@eq:m7-sum} 把所有关系都明确地写了出来，不过如果我偏好 {@eq:m7-ofs} 的简洁，希望你能原谅我。

<table id="eq:m7-sum">
<col span=2 align="right">
<tr>
  <td rowspan=5 class="eqnrcell">({!@eq:m7-sum})
  <td>
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mstyle displaystyle="true" scriptlevel="0">
        <mrow data-mjx-texclass="ORD">
          <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
            <mtr>
              <mtd>
                <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                  <mtr>
                    <mtd>
                      <mi>&#x3BB;</mi>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mi>w</mi>
                          <mo>,</mo>
                          <mi>y</mi>
                        </mrow>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mrow data-mjx-texclass="ORD">
                        <mo>/</mo>
                      </mrow>
                      <mtext>&#xA0;</mtext>
                      <mo stretchy="false">(</mo>
                      <mo stretchy="false">(</mo>
                      <msub>
                        <mi>y</mi>
                        <mi>s</mi>
                      </msub>
                      <mo>&#x2212;</mo>
                      <mi>T</mi>
                      <mo stretchy="false">)</mo>
                      <msub>
                        <mi>v</mi>
                        <mi>y</mi>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mo>+</mo>
                      <mi>D</mi>
                      <msub>
                        <mi>w</mi>
                        <mi>y</mi>
                      </msub>
                      <mo stretchy="false">)</mo>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <msub>
                        <mi>p</mi>
                        <mi>a</mi>
                      </msub>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <mi>&#x3BB;</mi>
                      <mtext>&#xA0;</mtext>
                      <msub>
                        <mi>u</mi>
                        <mi>x</mi>
                      </msub>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <msub>
                        <mi>p</mi>
                        <mi>c</mi>
                      </msub>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <mi>&#x3BB;</mi>
                      <mtext>&#xA0;</mtext>
                      <msub>
                        <mi>u</mi>
                        <mi>z</mi>
                      </msub>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>d</mi>
                      <mi>x</mi>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mi>w</mi>
                          <mo>,</mo>
                          <mi>x</mi>
                        </mrow>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mo>+</mo>
                      <mtext>&#xA0;</mtext>
                      <mi>&#x3BB;</mi>
                      <mo stretchy="false">(</mo>
                      <mi>L</mi>
                      <msub>
                        <mi>u</mi>
                        <mi>x</mi>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mo>+</mo>
                      <mtext>&#xA0;</mtext>
                      <mo stretchy="false">(</mo>
                      <mi>T</mi>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>y</mi>
                        <mi>s</mi>
                      </msub>
                      <mo stretchy="false">)</mo>
                      <msub>
                        <mi>v</mi>
                        <mi>x</mi>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mo>&#x2212;</mo>
                      <mi>D</mi>
                      <msub>
                        <mi>w</mi>
                        <mi>x</mi>
                      </msub>
                      <mo stretchy="false">)</mo>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>d</mi>
                      <mi>y</mi>
                    </mtd>
                    <mtd style="text-align: left;">
                      <mi></mi>
                      <mo>=</mo>
                      <msub>
                        <mi>a</mi>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mi>w</mi>
                          <mo>,</mo>
                          <mi>z</mi>
                        </mrow>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mo>+</mo>
                      <mtext>&#xA0;</mtext>
                      <mi>&#x3BB;</mi>
                      <mo stretchy="false">(</mo>
                      <mi>L</mi>
                      <msub>
                        <mi>u</mi>
                        <mi>z</mi>
                      </msub>
                      <mtext>&#xA0;</mtext>
                      <mo>+</mo>
                      <mtext>&#xA0;</mtext>
                      <mo stretchy="false">(</mo>
                      <mi>T</mi>
                      <mo>&#x2212;</mo>
                      <msub>
                        <mi>y</mi>
                        <mi>s</mi>
                      </msub>
                      <mo stretchy="false">)</mo>
                      <msub>
                        <mi>v</mi>
                        <mi>z</mi>
                      </msub>
                      <mo>&#x2212;</mo>
                      <mi>D</mi>
                      <msub>
                        <mi>w</mi>
                        <mi>z</mi>
                      </msub>
                      <mo stretchy="false">)</mo>
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

注意，如果我们取顶部为 0 且无俯仰（_T_=0 且 θ=0），我们就得到了和第一个 mode 7 章节完全相同的结果；而如果我们直视下方（θ=90°），整个式子就简化成绕点 (−*L, *T*) 的一个简单缩放/旋转，这正是它应该有的样子。{*@eq:m7-sum} 是 mode 7 的通用方程；在实现中，你常常可以做若干捷径来加速计算，不过我们[稍后](#eq-aff-calc)再谈。

### 距离雾效 {#ssec-flr-fog}

在现实世界中，来自远处物体的光线必须穿过大气层，大气会散射光子，从而衰减光束。你最终看到的，部分是物体本身，部分是环境色，而且原始物体越远，它的贡献就越小。由于这种效应在雾天最易观察，我把这个效应叫做<dfn>雾效</dfn>。

雾效提供了一种距离的暗示，加入它可以增强纵深感。此外，它还能掩盖物体被载入时突然弹出画面的现象。就 GBA 而言，它可以通过在每条扫描线上使用不同的 alpha 混合来实现。

这方面的基本方程如下面的微分方程：

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
              <mtr>
                <mtd>
                  <mi>d</mi>
                  <mi>I</mi>
                  <mo>=</mo>
                  <mo>&#x2212;</mo>
                  <mi>I</mi>
                  <mtext>&#xA0;</mtext>
                  <mi>k</mi>
                  <mo stretchy="false">(</mo>
                  <mi>&#x3BD;</mi>
                  <mo stretchy="false">)</mo>
                  <mtext>&#xA0;</mtext>
                  <mi>&#x3C1;</mi>
                  <mtext>&#xA0;</mtext>
                  <mi>d</mi>
                  <mi>z</mi>
                </mtd>
              </mtr>
            </mtable>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>

其中 _I_ 是强度；_k_(ν) 是介质的吸收系数，它取决于光的频率 ν，也可能取决于位置；ρ 是密度，_z_ 是距离。求解这个方程会得到随距离呈指数衰减的结果。而我指的确实是真实距离，包含平方和开方等等。

幸运的是，我们不需要用那么复杂的东西；我们真正需要的只是一种函数关系，让它在无穷远处为 0、在近处为 1。有趣的是，我们已经有了类似的东西，即作为扫描线函数的 λ（见 {!@eq:m7-sum}）。这基本上是一条双曲线，你只需摆弄一下缩放因子和偏移量，就能得到看起来不错的效果。就我而言，λ*6/16 似乎就够好了。

<div class="cblock">
  <table class="bdr" id="fig:img-fog" border=0 cellpadding=2 cellspacing=2>
    <tr>
      <td> <img src="img/mode7/fog_off.png" alt="fog off"> </td>
      <td> <img src="img/mode7/fog_on.png" alt="fog on"> </td>
    </tr>
    <tr>
      <td>
        <b>{*@fig:img-fog}</b>: fog off (left) and on (right).
      </td>
    </tr>
  </table>
</div>

{*@fig:img-fog} 展示了从相当高的高度看到的、有雾效与无雾效的截图。到地面的距离在屏幕底部相对较小，所以那些部分仍然非常清晰可见。在地平线处，地面完全被橙色雾遮挡；这其实是件好事，因为靠近地平线的线条通常本来也不怎么好看。

顺便说一句，请注意我说的是_橙色_雾。如果你在[图形特效](gfx.html#sec-blend)章节里留心过，就会知道 GBA 只有针对白色和黑色的渐隐模式。尽管如此，渐隐到任意颜色是完全可能的，不过我要等到实现部分再解释。在你琢磨它怎么做到的时候，我继续讲 3D 精灵(对象)。

## 精灵(对象) {#sec-objs}

精灵(对象)与 3D 是个奇怪的组合。就其本质而言，精灵(对象)是 2D 物体——就像贴在视口（即屏幕）上的贴纸。要让它们看起来属于 3D 世界，你必须让它们在屏幕上以这样的方式移动：看起来像是在随世界一起动，并根据距离缩放它们。再一次，这的基础是 @eq:m7-main，但远不止如此。

这里有四个主题必须涵盖。第一个是精灵(对象)的**定位**。{*@eq:m7-main} 在点/像素层面有效，而一个精灵(对象)是一个简单的矩形。虽然你可以重写精灵(对象)的像素来绕过这一点，但那在某种程度上违背了使用精灵(对象)的初衷。相反，我们会把物体上的一个点与精灵(对象)的世界坐标联系起来，并设置 OAM 的位置和矩阵来适应这一点。这基本上就是仿射对象章节中讨论过的[锚定](affobj.html#sec-combo)理论。

接下来是精灵(对象)**剔除**。一旦你有了正确的 OAM 位置，就不能原样使用它们，你必须确保只有当精灵(对象)确实可见（位于视口内）时才激活它。否则，应当禁用它。

然后是精灵(对象)**动画**的问题。考虑 {@fig:img-m7-obj} 中 Toad 的赛车，它有着正确的锚定位置，但无论你从哪个角度看，它都会显示同一面。为了让它看起来像你真的能绕着物体移动，我们会使用不同的动画帧来显示不同的侧面。

最后是精灵(对象)**排序**。默认情况下，对象会按对象编号排序：obj 0 在 obj 1 之上，obj 1 在 obj 2 之上，依此类推。总是把一个精灵(对象)链接到同一个对象，意味着如果你从另一侧看它们，顺序就会出错，所以我们需要按距离对它们排序。

这些是要处理的主要问题。还有几个其他的，比如放置阴影，以及使用预缩放的对象来绕过 32 个仿射矩阵这一硬件限制，但一旦其他几点解决了，这些就相当容易了。我也会讨论一点我称之为对象**重归一化**的东西：对对象施加一个额外的缩放，使它们不会长得超出自己的裁剪矩形。

<table id="fig:img-m7-obj" class="bdr" style="width:512px; margin:10px auto;" border=0 cellpadding=2 cellspacing=0>
  <tr>
    <td><img src="img/mode7/obj_back.png" alt="normal view"></td>
    <td><img src="img/mode7/obj_down.png" alt="looking down"></td>
    <td><img src="img/mode7/obj_right.png" alt="looking down and left"></td>
  </tr>
  <tr>
    <td colspan=3>
      <b>{*@fig:img-m7-obj}</b>：锚定的精灵(对象)。位置是对的，但无论你怎么转，Toad 总是背对着你。也许是那顶帽子。
    </td>
  </tr>
</table>

### 定位与锚定 {#ssec-obj-pos}

精灵(对象)的定位包含两个层面。其一是把精灵(对象)的世界坐标 **x**<sub>w</sub> 变换到屏幕上的位置 **x**<sub>s</sub>。在此之后，你需要利用该点来确定最合适的 OAM 坐标。

第一部分不过是 {@eq:m7-main} 的又一次应用，只是方向相反。通常，求一个三维矩阵的逆是一件相当无趣的事，但相机矩阵恰好是一个正交归一矩阵。所谓的<dfn>正交归一矩阵</dfn>，是指其各组成向量彼此正交（相互垂直）且长度均为 1 的矩阵。正交归一矩阵的一个妙处在于，它的逆矩阵恰好就是它的转置：**C**<sup>−1</sup> = **C**<sup>T</sup>。由此我们得到下面这些式子：

<table id="eq:obj-w2s">
  <tr>
    <td class="eqnrcell">({!@eq:obj-w2s})
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                    <mtr>
                      <mtd>
                        <msub>
                          <mi>x</mi>
                          <mi>p</mi>
                        </msub>
                      </mtd>
                      <mtd style="text-align: left;">
                        <mi></mi>
                        <mo>=</mo>
                        <msup>
                          <mi>C</mi>
                          <mi>T</mi>
                        </msup>
                        <mtext>&#xA0;</mtext>
                        <mo>&#x22C5;</mo>
                        <mtext>&#xA0;</mtext>
                        <mo stretchy="false">(</mo>
                        <msub>
                          <mi>x</mi>
                          <mi>w</mi>
                        </msub>
                        <mo>&#x2212;</mo>
                        <msub>
                          <mi>a</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mi>c</mi>
                            <mi>w</mi>
                          </mrow>
                        </msub>
                        <mo stretchy="false">)</mo>
                        <mrow data-mjx-texclass="ORD">
                          <mo>/</mo>
                        </mrow>
                        <mi>&#x3BB;</mi>
                      </mtd>
                    </mtr>
                    <mtr>
                      <mtd>
                        <msub>
                          <mi>x</mi>
                          <mi>s</mi>
                        </msub>
                      </mtd>
                      <mtd>
                        <mi></mi>
                        <mo>=</mo>
                        <mi>S</mi>
                        <mo stretchy="false">(</mo>
                        <mn>1</mn>
                        <mo>,</mo>
                        <mo>&#x2212;</mo>
                        <mn>1</mn>
                        <mo>,</mo>
                        <mn>1</mn>
                        <mo stretchy="false">)</mo>
                        <mtext>&#xA0;</mtext>
                        <mo>&#x22C5;</mo>
                        <mtext>&#xA0;</mtext>
                        <mo stretchy="false">(</mo>
                        <msub>
                          <mi>x</mi>
                          <mi>p</mi>
                        </msub>
                        <mo>&#x2212;</mo>
                        <msub>
                          <mi>a</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mi>s</mi>
                            <mi>p</mi>
                          </mrow>
                        </msub>
                        <mo stretchy="false">)</mo>
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

这里唯一真正未知的量就是 λ，我们可以利用 _z_<sub>p</sub> = −*D* 这一事实来把它算出来。现在设相机与精灵(对象)之间的距离为 **r** = **x**<sub>w</sub> − **a**<sub>cw</sub>；利用 **C** = \[**u v w**\]，可得

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
              <mtr>
                <mtd>
                  <mi>&#x3BB;</mi>
                </mtd>
                <mtd>
                  <mi></mi>
                  <mo>=</mo>
                  <mo>&#x2212;</mo>
                  <mi>w</mi>
                  <mo>&#x22C5;</mo>
                  <mi>r</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <mi>D</mi>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <msub>
                    <mi>x</mi>
                    <mi>p</mi>
                  </msub>
                </mtd>
                <mtd style="text-align: left;">
                  <mi></mi>
                  <mo>=</mo>
                  <mi>u</mi>
                  <mo>&#x22C5;</mo>
                  <mi>r</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <mi>&#x3BB;</mi>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <msub>
                    <mi>y</mi>
                    <mi>p</mi>
                  </msub>
                </mtd>
                <mtd style="text-align: left;">
                  <mi></mi>
                  <mo>=</mo>
                  <mi>v</mi>
                  <mo>&#x22C5;</mo>
                  <mi>r</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <mi>&#x3BB;</mi>
                </mtd>
              </mtr>
            </mtable>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>

<div class="cpt_fr" style="width:88px;">
  <img src="img/mode7/anchor.png" id="fig:img-anchor" alt="a sprite, with anchor">
  <br>
  <b>{*@fig:img-anchor}</b>: a 32&times;32 sprite, with the anchor <b>p</b><sub>0</sub> relative to the top-left.
</div>

在那之后，求 **x**<sub>w</sub> 的屏幕位置就微不足道了。现在来看锚定部分。把对象想象成要钉到板子（即屏幕）上的纸片，而不是贴纸。图钉穿过物体的某一点，那一点就固定在板子上。那个点就是<dfn>锚点</dfn>。对于仿射对象，这并不像那么简单，因为我们必须指定 OAM 坐标而非锚点坐标，所以这里有点数学，即如何用纹理锚点 **p**<sub>0</sub> 和屏幕锚点 **q**<sub>0</sub> 来表达 OAM 坐标 **x**。这个理论在[仿射对象](affobj.html#sec-combo)章节讲过，并导出了 @eq:anchor。那里的其他量是对象的大小，**s** = (_w_, *h*)，以及 _m_，对普通仿射对象为 ½，对双倍尺寸仿射对象为 1。

<table id="eq:anchor">
  <tr>
    <td class="eqnrcell">({!@eq:anchor})
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                    <mtr>
                      <mtd>
                        <mi>x</mi>
                        <mo>=</mo>
                        <msub>
                          <mi>q</mi>
                          <mn>0</mn>
                        </msub>
                        <mo>&#x2212;</mo>
                        <mi>m</mi>
                        <mi>s</mi>
                        <mo>&#x2212;</mo>
                        <msup>
                          <mi>P</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mo>&#x2212;</mo>
                            <mn>1</mn>
                          </mrow>
                        </msup>
                        <mtext>&#xA0;</mtext>
                        <mo>&#x22C5;</mo>
                        <mtext>&#xA0;</mtext>
                        <mo stretchy="false">(</mo>
                        <msub>
                          <mi>p</mi>
                          <mn>0</mn>
                        </msub>
                        <mo>&#x2212;</mo>
                        <mi>&frac12; s</mi>
                        <mo stretchy="false">)</mo>
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

现在的任务，是把我们掌握的数据联系到这个方程上。屏幕锚点 **q**<sub>0</sub> 就是 **x**<sub>s</sub>。纹理锚点 **p**<sub>0</sub> 是你想保持固定的纹理空间中的像素，可以由你选择。对于赛车精灵(对象)，把它放在赛车底部附近是有意义的，如 @fig:img-anchor 所示。‘向量’ **s** 由对象的大小给出，此例中为 (32, 32)，而且因为我在这里总是选择双倍尺寸对象，所以 _m_=1。**P** 矩阵就是按 λ 缩放（除非你还想加入其他东西）。剩下的就只是把数值填进去了。

### 精灵(对象)剔除 {#ssec-obj-cull}

<div class="cpt_fr" style="width:308px;">
  <img src="img/mode7/viewport_obj.png" id="fig:img-vp-obj" alt="">
  <br>
  <b>{*@fig:img-vp-obj}</b>：带精灵(对象) <i>a</i>、<i>b</i> 和 <i>c</i> 的可视体。<i>b</i> 和 <i>c</i> 可见，<i>a</i> 不可见。
</div>

<dfn>剔除</dfn>（culling）是移除任何不可见的世界部分的过程。在这里，它意味着移除那些不在可视体内的精灵(对象)。这是件非常明智的事，对精灵(对象)来说更有意义，因为如果不这么做，OAM 将无法应付 **x**<sub>s</sub> 可能的取值范围，从而造成严重混乱。

首先要做的是一次距离检查：如果对象太远，就不该被看到。做一个近平面距离检查也是个好主意。然后你必须测试它与视口是否相交。每个精灵(对象)在投影平面上由一个矩形界定，如果这个矩形完全在视口之外，该对象就不应被渲染。

{*@fig:img-vp-obj} 展示了几个这样的例子。对象 _a_ 和 _b_ 已经被投影到投影平面上。对象 _a_ 在视口之外，应当被禁用。对象 _b_ 部分可见，应当被渲染。对象 _c_ 尚未投影，但落在近平面和远平面之间，至少应当被测试（然后发现完全可见）。

实际上，在 3D 相机空间中做可视体检查，比在 2D 投影空间中更容易。对象矩形可以很容易地从 **x**<sub>c</sub> = **C**<sup>T</sup>·**r**、锚点 **p**<sub>0</sub> 和大小 **s** 算出来。视口需要按 λ 缩放，这给了我们下面这些要做的测试：

<div class="lblock">
  <table id="tbl:culltest" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:culltest}</b>：相机空间中的对象矩形与剔除测试。注意符号！
    </caption>
    <tbody>
      <tr>
        <th>&nbsp;</th><th>Object position</th><th>Visible if</th>
      </tr>
      <tr>
        <th> 深度 </th>
        <td> 
          <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
            <mstyle displaystyle="true" scriptlevel="0">
              <mrow data-mjx-texclass="ORD">
                <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                  <mtr>
                    <mtd>
                      <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                        <mtr>
                          <mtd>
                            <mi>d</mi>
                            <mo>=</mo>
                            <mo>&#x2212;</mo>
                            <msub>
                              <mi>z</mi>
                              <mi>c</mi>
                            </msub>
                            <mo>=</mo>
                            <mi>w</mi>
                            <mo>&#x22C5;</mo>
                            <mi>r</mi>
                          </mtd>
                        </mtr>
                      </mtable>
                    </mtd>
                  </mtr>
                </mtable>
              </mrow>
            </mstyle>
          </math>
        </td>
        <td>
          <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
            <mstyle displaystyle="true" scriptlevel="0">
              <mrow data-mjx-texclass="ORD">
                <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                  <mtr>
                    <mtd>
                      <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                        <mtr>
                          <mtd>
                            <mi>N</mi>
                            <mo>&#x2264;</mo>
                            <mi>d</mi>
                            <mtext>&#xA0;</mtext>
                            <mi mathvariant="normal">&amp;</mi>
                            <mi mathvariant="normal">&amp;</mi>
                            <mtext>&#xA0;</mtext>
                            <mi>d</mi>
                            <mo>&lt;</mo>
                            <mi>F</mi>
                          </mtd>
                        </mtr>
                      </mtable>
                    </mtd>
                  </mtr>
                </mtable>
              </mrow>
            </mstyle>
          </math>
        </td>
      </tr>
      <tr>
        <th> 水平 </th>
        <td> 
          <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
            <mstyle displaystyle="true" scriptlevel="0">
              <mrow data-mjx-texclass="ORD">
                <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                  <mtr>
                    <mtd>
                      <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                        <mtr>
                          <mtd>
                            <mi>l</mi>
                            <mo>=</mo>
                            <msub>
                              <mi>x</mi>
                              <mi>c</mi>
                            </msub>
                            <mo>&#x2212;</mo>
                            <msub>
                              <mi>p</mi>
                              <mrow data-mjx-texclass="ORD">
                                <mn>0</mn>
                                <mo>,</mo>
                                <mi>x</mi>
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
        </td>
        <td>
          <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
            <mstyle displaystyle="true" scriptlevel="0">
              <mrow data-mjx-texclass="ORD">
                <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                  <mtr>
                    <mtd>
                      <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                        <mtr>
                          <mtd>
                            <mi>&#x3BB;</mi>
                            <mi>L</mi>
                            <mo>&#x2264;</mo>
                            <mi>l</mi>
                            <mo>+</mo>
                            <mi>w</mi>
                            <mtext>&#xA0;</mtext>
                            <mi mathvariant="normal">&amp;</mi>
                            <mi mathvariant="normal">&amp;</mi>
                            <mtext>&#xA0;</mtext>
                            <mi>l</mi>
                            <mo>&lt;</mo>
                            <mi>&#x3BB;</mi>
                            <mi>R</mi>
                          </mtd>
                        </mtr>
                      </mtable>
                    </mtd>
                  </mtr>
                </mtable>
              </mrow>
            </mstyle>
          </math>
        </td>
      </tr>
      <tr>
        <th> 垂直 </th>
        <td>
          <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
            <mstyle displaystyle="true" scriptlevel="0">
              <mrow data-mjx-texclass="ORD">
                <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                  <mtr>
                    <mtd>
                      <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                        <mtr>
                          <mtd>
                            <mi>t</mi>
                            <mo>=</mo>
                            <mo>&#x2212;</mo>
                            <msub>
                              <mi>y</mi>
                              <mi>c</mi>
                            </msub>
                            <mo>&#x2212;</mo>
                            <msub>
                              <mi>p</mi>
                              <mrow data-mjx-texclass="ORD">
                                <mn>0</mn>
                                <mo>,</mo>
                                <mi>y</mi>
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
        </td>
        <td>
          <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
            <mstyle displaystyle="true" scriptlevel="0">
              <mrow data-mjx-texclass="ORD">
                <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                  <mtr>
                    <mtd>
                      <mtable displaystyle="true" columnalign="right" columnspacing="" rowspacing="3pt">
                        <mtr>
                          <mtd>
                            <mi>&#x3BB;</mi>
                            <mi>T</mi>
                            <mtext>&#xA0;</mtext>
                            <mo>&#x2264;</mo>
                            <mtext>&#xA0;</mtext>
                            <mi>t</mi>
                            <mo>+</mo>
                            <mi>h</mi>
                            <mtext>&#xA0;</mtext>
                            <mi mathvariant="normal">&amp;</mi>
                            <mi mathvariant="normal">&amp;</mi>
                            <mtext>&#xA0;</mtext>
                            <mi>t</mi>
                            <mo>&lt;</mo>
                            <mo>&#x2212;</mo>
                            <mi>&#x3BB;</mi>
                            <mi>B</mi>
                          </mtd>
                        </mtr>
                      </mtable>
                    </mtd>
                  </mtr>
                </mtable>
              </mrow>
            </mstyle>
          </math> 
        </td>
      </tr>
    </tbody>
  </table>
</div>

如果所有这些条件都为真，那么该对象就应该是可见的。现在，请注意测试的_符号_，特别是在垂直检查中。

### 动画 {#ssec-obj-ani}

<div class="cpt_fr" style="width:200px;">
  <img src="img/mode7/psi_def.png" id="fig:img-psi-def" alt="view angle">
  <br>
  <b>{*@fig:img-psi-def}</b>: Finding the view-angle &psi;.
</div>

准确地说，是旋转动画。正如我们在 {@fig:img-m7-obj} 中看到的，无论你从哪个角度看，精灵(对象)都会显示同一面。这很合逻辑，因为精灵(对象)并不是一个真正的 3D 实体。为了让它_看起来_更 3D 一点，我们需要有从不同的相机角度拍摄的精灵(对象)图像，然后根据我们所观察的角度，挑选需要的那一帧。

首先，找到正确的视角 ψ。{*@fig:img-psi-def} 展示了一般情形。你需要的角度是相机与物体之间向量（红色虚线）和物体全局朝向之间的夹角。图中可以看到相机和物体的全局方向角：分别为 φ<sub>c</sub> 和 φ<sub>o</sub>。还标出了相机方向与精灵(对象)之间的夹角 α。仔细观察这些角度，你会看到 φ<sub>c</sub> + α + ψ = φ<sub>o</sub>。换句话说：

<table id="eq:psi">
  <tr>
    <td class="eqnrcell">({!@eq:psi}) </td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                    <mtr>
                      <mtd>
                        <mi>&#x3C8;</mi>
                      </mtd>
                      <mtd style="text-align: left;">
                        <mi></mi>
                        <mo>=</mo>
                        <msub>
                          <mi>&#x3C6;</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mn>0</mn>
                          </mrow>
                        </msub>
                        <mo>&#x2212;</mo>
                        <msub>
                          <mi>&#x3C6;</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mi>c</mi>
                          </mrow>
                        </msub>
                        <mo>&#x2212;</mo>
                        <mi>&#x3B1;</mi>
                      </mtd>
                    </mtr>
                    <mtr>
                      <mtd></mtd>
                      <mtd>
                        <mi></mi>
                        <mo>=</mo>
                        <msub>
                          <mi>&#x3C6;</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mn>0</mn>
                          </mrow>
                        </msub>
                        <mo>&#x2212;</mo>
                        <msub>
                          <mi>&#x3C6;</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mi>c</mi>
                          </mrow>
                        </msub>
                        <mo>&#x2212;</mo>
                        <mi>arctan</mi>
                        <mo data-mjx-texclass="NONE">&#x2061;</mo>
                        <mrow>
                          <mo data-mjx-texclass="OPEN">(</mo>
                          <msub>
                            <mi>x</mi>
                            <mi>c</mi>
                          </msub>
                          <mrow data-mjx-texclass="ORD">
                            <mo>/</mo>
                          </mrow>
                          <mo>&#x2212;</mo>
                          <msub>
                            <mi>z</mi>
                            <mi>c</mi>
                          </msub>
                          <mo data-mjx-texclass="CLOSE">)</mo>
                        </mrow>
                      </mtd>
                    </mtr>
                  </mtable>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

arctan() 里面的负号是否必要，取决于你如何定义所有项。{*@eq:psi} 是完全正确的版本，但如果你不喜欢反正切，你会很高兴地知道，在大多数情况下 α 项可以安全地忽略，而没人会发现。

现在有了视角，我们需要以某种方式使用它。假设你有 _N_ 帧旋转动画，把圆分成相等的部分，每部分宽 2π/_N_ 弧度。为了得到 ψ 所在的切片，我们只需除以每个切片的角度：*i* = ψ/(2π/_N_) = *N*·ψ/(2π)。如果你用 2 的幂来划分圆（我们正是这么做的），这部分就简单得可笑：只需一个右移。一旦有了帧索引，剩下的应该就很简单了。大体如此。不过有一些错综复杂之处会把它搅浑，但这些取决于具体实现，留到以后再说。

### 精灵(对象)排序 {#ssec-obj-sort}

暂且不考虑优先级位，屏幕上对象的顺序由对象编号决定：编号小的在编号大的前面。在 2D 游戏中，你常常可以忽略这一点，因为精灵(对象)会在同一层上；在 3D 游戏中，你真的、真的不能忽略。以 {@fig:img-obj-sort} 为例。这里的四个 thwomp 有特定的对象顺序。在左图中，最近的 thwomp 恰好编号最小，视觉顺序是正确的。然而，从另一侧看时（中图），情况略有不同。有两个关于深度的视觉线索：缩放（越远越小）和遮挡（较远的物体被较近的物体遮住）。在中图中，这两点相互冲突，因为最近的物体有_最大_的编号，使整幅图有点令人不安。在右图中，一切又看起来正常了，因为采取了措施来确保正确的对象顺序。

<table id="fig:img-obj-sort" class="bdr" style="width:512px; margin:10px auto;" border=0 cellpadding=2 cellspacing=2>
  <tr>
    <td><img src="img/mode7/order_dflt.png" alt="default order"></td>
    <td><img src="img/mode7/order_nosort.png" alt="non-sorted"></td>
    <td><img src="img/mode7/order_sorted.png" alt="sorted"></td>
  </tr>
  <tr>
    <td colspan=3>
      <b>{*@fig:img-obj-sort}</b>。未排序的对象从一个角度看还行（左），但从另一角度看就不行（中）。你需要对它们排序才能得到正确的顺序（右）。
    </td>
  </tr>
</table>

需要做的事情，是按深度对 OAM 中的对象排序；这有点像对象的 [Z-buffer](https://en.wikipedia.org/wiki/Z-buffering)。精灵(对象)的深度就是简单的 _z_<sub>c</sub>，我们需要按 _z_<sub>c</sub> 升序将精灵(对象)的属性填入 OAM。为稳妥起见，给隐藏对象赋予尽可能大的深度值，或者干脆把它们排除在排序过程之外，可能是个好主意。

排序对象有很多可能的策略。我自己目前的选择是不直接排序精灵(对象)或对象，而是创建一个**索引表**，指示精灵(对象)的属性应按什么顺序进入 OAM。其伪代码如下。至于你用哪种算法给键排序，此刻并不重要，只要它能完成任务。我相信可以找到更快的方法，但代价是更多的代码，而我想让事情相对简单。

```c
// Pseudo code for sorting sprites for OAM
void spr_sort()
{
    int ids[N];     // Index table
    int keys[N];    // Sort keys

    // Create initial index and sort-key table
    for ii=0; ii<N; ii++)
    {
        ids[ii]= ii;
        keys[ii]= is_visible(sprite[ii]) ? sprite[ii].depth : DEPTH_MAX;
    }

    // Sort keys (i.e., fill ids)
    id_sort(ids, keys);

    // Fill OAM according to
    for(ii=0; ii<N; ii++)
        oam_mem[ii]= sprite[ids[ii]].obj;
}
```

### 重归一化 {#ssec-obj-norm}

如果你以前从没听说过这个术语，我一点都不会惊讶。<dfn>归一化</dfn>（Normalization）是指把一个量缩放成一个便于使用的值——通常是 1。你已经按因子 λ 缩放了精灵(对象)，但那还不够。在大多数情况下，你还必须进一步缩放它，即_重归一化_（renormalize）它。原因如下。

按定义，当 _z_<sub>c</sub> = −*D* 时，缩放因子 λ 为 1。现在考虑当你看一个更近的物体时会发生什么，比如 _z_<sub>c</sub> = −½*D*。此时 λ 为 ½，该对象会被放大两倍。换句话说，它已经填满了双倍尺寸的画布。而且还可能得到更高的缩放：取建议值 *D* = 256 和 *N* = 24，你最终可能得到 10 倍的缩放！这可不行。

可以通过把近平面移得更远来绕过这个问题。然而，那样的话，当物体还相当远的时候你就会看到它们消失，这看起来和看到它们被裁剪一样奇怪。更好的解决办法是给对象一个额外的缩放因子。在 `m7_ex` 中，我把对象额外缩放了 ¼，这样一个 32x32 的精灵(对象)实际上只有 8x8 的‘世界’像素大小。这似乎运作得相当好。

这个重归一化意味着你实际上是在使用_两个独立_的缩放因子：一个用于坐标变换，一个用于视觉效果。在定位和剔除精灵(对象)时，你需要使用的是_视觉_缩放，而不是变换缩放；后者的影响在你找到锚点的屏幕位置后就停止了。

这个过程可能有官方术语，但我不知道是什么。我对重归一化的了解来自物理学（几年前几位荷兰教授因此获得了诺贝尔奖），而且它似乎很贴切。如果你知道官方术语，我很想听听。

<div class="cblock">
  <table id="fig:img-obj-norm" class="bdr" width=512 border=0 cellpadding=4 cellspacing=0>
    <tr>
      <td><img src="img/mode7/norm_1x.png" alt="norm 1x"></td>
      <td><img src="img/mode7/norm_2x.png" alt="norm 2x"></td>
      <td><img src="img/mode7/norm_4x.png" alt="norm 4x"></td>
    </tr>
    <tr>
      <td colspan=3>
        <b>{*@fig:img-obj-norm}</b>。对象重归一化。左：正常（呃，不行！）。中：&times;&frac12;（嗯，不行）。右：&times;&frac14;（对，就是这个）。
      </td>
    </tr>
  </table>
</div>

至此，我们到达了理论的终点。现在来真正地实现这一切。

## 实现 {#sec-code}

### 设计考量 {#ssec-code-design}

我这里的目标不只是随便给出几个能让 mode 7 跑起来的函数，还要提供在必要时易于修改的东西。`m7_ex` 演示的代码分布在 4 个文件中：演示本身特有的部分在 `m7_ex.c`；mode 7 特有的部分在 `mode7.h`、`mode7.c` 和 `mode7.iwram.c`。是的，还有 iwram 函数；其中一些东西计算量很大，我想一开始就让它们尽可能快。我还会从[优先级演示](lab.html##ssec-prio-objsort)借用对象排序器。

这里有三个主要关注的领域：**相机**、**背景相关**和**精灵(对象)**。对每一项，我们都会用一个结构体（struct）和/或数组来保存其数据，这样很有面向对象（OOP）的风格。还会有一个管理器结构体来统管 mode 7 整体。当然，我们需要为视体、焦距和另外几项定义常量。然后，少量函数会操作这些项，给出我们需要的东西。

#### 常量

常量不太多。大多与视口有关，其余与焦距和重归一化有关。

```c
#define M7_D        256     //!< Focal length
#define M7_D_SHIFT    8     //!< Focal shift
#define M7O_NORM      2     //!< Object renormalization shift (by /4)

// View frustum limits
#define M7_LEFT     (-120)      //!< Viewport left
#define M7_RIGHT     120        //!< Viewport right
#define M7_TOP        80        //!< Viewport top (y-axis up)
#define M7_BOTTOM   (-80)       //!< Viewport bottom (y-axis up!)
#define M7_NEAR       24        //!< Near plane (objects)
#define M7_FAR       512        //!< Far plane (objects)

#define M7_FAR_BG    768        //!< Far plane (floor)
```

#### 结构体与变量 {#ssec-code-class}

Mode 7 本该是用类的绝佳场所，但由于我用的是 C 而非 C++，我坚持使用结构体。除了我在[仿射背景](affbg.html)页面上给出的 `BG_AFFINE` 结构体，你还需要一个用于相机、一个用于 mode 7 对象的结构体。我还在使用一个 mode 7 容器结构体来跟踪构成 mode 7 功能的所有部分，这样你就不会有一堆松散的全局变量到处散落。

你可以自由地为自己创建这些结构体，但我将使用的那些如下。如果你一直留心，这些成员大多应该很熟悉。哦，`POINT` 和 `VECTOR` 结构体当然是 2D 和 3D 向量。

```c
//! 3D sprite struct
typedef struct M7_SPRITE
{
    VECTOR pos;     //!< World position.
    POINT anchor;   //!< Sprite anchor.
    OBJ_ATTR obj;   //!< Object attributes.
    s16 phi;        //!< Azimuth angle.
    u8 obj_id;      //!< Object index.
    u8 aff_id;      //!< OBJ_AFFINE index.
    TILE *tiles;    //!< Gfx pointer.
    VECTOR pos2;    //!< Position in cam space (subject to change)
} M7_SPRITE;

//! 3D camera struct
typedef struct M7_CAM
{
    VECTOR pos;     //!< World position.
    int theta;      //!< Polar angle.
    int phi;        //!< Azimuth angle.
    VECTOR u;       //!< local x-axis (right)
    VECTOR v;       //!< local y-axis (up)
    VECTOR w;       //!< local z-axis (back)
} M7_CAM;


//! One struct to bind them all
typedef struct M7_LEVEL
{
    M7_CAM *camera;         //!< Camera variables
    BG_AFFINE *bgaff;       //!< Affine parameter array
    M7_SPRITE *sprites;     //!< 3D sprites
    int horizon;            //!< Horizon scanline (sorta)
    u16 bgcnt_sky;          //!< BGxCNT for backdrop
    u16 bgcnt_floor;        //!< BGxCNT for floor
} M7_LEVEL;
```

关于这些结构体，我没什么更多要说的了。`M7_SPRITE` 把其对象的属性作为成员本身，而不是索引或指向任何缓冲区的指针。这背后的理由本质上是“为什么不呢”。因为我无论如何都要对对象排序，使用额外的缓冲区可能不值得，所以我选择了这种方式。我还在跟踪相机空间中的位置（因为我不只一次需要它），以及一个指向图形的 TILE 指针。其原因在实现动画时会变得明显。

`M7_LEVEL` 持有指向 mode 7 主要变量（相机、仿射数组和精灵(对象)）的指针，以及从远景切换到地面所需的地平线扫描线，还有两个保存 bg 控制寄存器数据的变量，因为这对远景和地面是不同的。

现在我们需要用这些结构体定义这四个变量。由于它们在技术上是演示本身的一部分，我把它们放在 `m7_ex.c` 而非 mode 7 主代码中，不过那段代码确实需要一个实际的 `m7_level` 变量供 HBlank 中断使用。`SPR_COUNT` 是精灵(对象)的数量，这_绝对_是演示特有的。`m7_bgaffs` 中有 161 个条目而非仅仅 160 个，原因与[DMA 演示](dma.html#sec-demo)相同：HBlank 设置的是下一行而非当前行，而拥有它比用 if/else 块更好（也更快）。

```c
M7_CAM m7_cam;
BG_AFFINE m7_bgaffs[SCREEN_HEIGHT+1];
M7_SPRITE m7_sprites[SPR_COUNT];

M7_LEVEL m7_level;
```

:::tip 结构体成员的类型与顺序

我通常的建议是对数据类型使用 int，但对结构体来说这未必总是最好的。局部变量可能不占用内存，但结构体要。而且当你有结构体数组时，字长成员带来的额外空间会迅速累积。所以这种情况下，尽管使用非 int 类型。

话虽如此，当要使用这些成员时，把它的数据复制到一个局部的 32 位变量中，而不是对所有计算都使用字节或半字成员，可能是值得的。

另外，这_非常_重要：如果你不注意成员的顺序，你省不下任何空间。一个 int 仍然需要字对齐，即使它紧接在一个字节成员之后。编译器可能会在字节和半字成员之后添加填充，以确保下一个成员正确对齐。最好以填充尽可能少的方式来排列成员顺序。

:::

### 背景函数 {#ssec-code-bg}

下面是我的四个主要背景函数：

- `void m7_prep_horizon(M7_LEVEL *level)`：计算地平线扫描线。
- `IWRAM_CODE void m7_prep_affines(M7_LEVEL *level)`：根据相机位置和朝向，计算地面的仿射参数。
- `void m7_update_sky(const M7_LEVEL *level)`：放置远景。
- `IWRAM_CODE void m7_hbl_floor()`：HBlank 中断例程。必要时切换到模式 2，并复制仿射参数、产生雾效。

`m7_prep_horizon()` 和 `m7_update_sky()` 分别是 {@eq:horz-line} 和 {@eq:psi} 的简单实现，所以这两我可以简略些。

```c
//! Calculate the horizon scanline
void m7_prep_horizon(M7_LEVEL *level)
{
    int horz;
    M7_CAM *cam= level->camera;

    if(cam->v.y != 0)
    {
        horz= M7_FAR_BG*cam->w.y - cam->pos.y;
        horz= M7_TOP - Div(horz*M7_D, M7_FAR_BG*cam->v.y);
    }
    else    // looking straight down (w.y > 0) means horizon at -inf scanline
        horz= cam->w.y > 0 ? INT_MIN : INT_MAX;

    level->horizon= horz;
}

//! Update sky-bg position
void m7_update_sky(const M7_LEVEL *level)
{
    REG_BG2HOFS= (level->camera->phi>>6)+M7_LEFT;
    REG_BG2VOFS= -clamp(level->horizon, 0, 228)-1;
}
```

地平线计算利用了裁剪远平面，不过这并非严格必要。如果你想要地平线在无穷远处，去掉减去相机高度的部分，并用 `M7_FAR_BG` = 1。注意对 _v_<sub>y</sub> = 0 的检查。由于 _v_<sub>y</sub> = cos(θ)，这在直视上方或直视下方时为真。区分很重要，因为一种情况看到天空（无仿射背景），另一种情况只看到地面（无远景）。严格来说，这些应该是 ±infinity，但由于这是定点数，`INT_MIN/MAX` 将不得不顶替。

至于远景的放置：我在这里走了_很多_捷径。一个数学上正确的远景会使用宽 1720 像素的背景地图。那可以做到，但多半就是烦人。相反，我用了一个 512x256 的常规背景，并在角度→滚动偏移转换中使用 *P* = 1024。这意味着地图在一个 360° 旋转中会出现两次，而且 _dx_ 就是 φ/64。是的，地面和远景的视场会略微不同步，但只有你知道该看哪里时才会注意到，所以没关系。

严格来说，垂直偏移应该是 bgHeight − horizon，但由于环绕，bg 高度可以被忽略。我把地平线钳制到视口大小的原因在于，地平线扫描线会变得非常大——里面的 tan(θ) 在向上看时会趋于无穷，记住了吗？如果不钳制它，你在向上平移时会把整个远景地图滚动好几遍，那看起来糟透了。

#### 准备仿射参数表

仿射参数的计算发生在 `m7_prep_affines()` 中。你可以尝试在 HBlank isr 中做这件事，但由于它需要一个除法，会花太长时间。而且，在一处做更高效，因为你只需设置一次变量。这个例程执行 {@eq:m7-sum} 的计算。它对每条扫描线都要做相当多的计算，包括一次除法，所以你可以预料它会相当昂贵；这也是我从一开始就把它放进 IWRAM 的原因。

现在，你不必为每条扫描线都做计算：只算地平线以下的部分就行。至于实现 {@eq:m7-sum} 本身：事实证明，如果你把相机矩阵重新拆开，使用 θ 和 φ 的正弦和余弦来算，会比使用那九个矩阵元素好得多。下面这段会解释如何做，但你可以跳过它直接看代码。

记住相机矩阵是 **C** = **R**<sub>y</sub>(φ)·**R**<sub>x</sub>(θ)；而 λ 和 **dx** 是通过 {@eq:m7-ofs} 算出的：**dx**′ = **a**<sub>cw</sub> + λ·**C**·**b**。你可以把 **C** 拆开，再与 **b** 结合，形成 **b**′ = **R**<sub>x</sub>(θ)·**b**。这个新向量完全处理了俯仰——就好像我们只绕垂直轴旋转一样，也就是上一章讨论的情形。有了这个预旋转，代码变得更简单、更快。

```c
IWRAM_CODE void m7_prep_affines(M7_LEVEL *level)
{
    if(level->horizon >= SCREEN_HEIGHT)
        return;

    int ii, ii0= (level->horizon>=0 ? level->horizon : 0);

    M7_CAM *cam= level->camera;
    FIXED xc= cam->pos.x, yc= cam->pos.y, zc=cam->pos.z;

    BG_AFFINE *bga= &level->bgaff[ii0];

    FIXED yb, zb;           // b' = Rx(theta) *  (L, ys, -D)
    FIXED cf, sf, ct, st;   // sines and cosines
    FIXED lam, lcf, lsf;    // scale and scaled (co)sine(phi)
    cf= cam->u.x;      sf= cam->u.z;
    ct= cam->v.y;      st= cam->w.y;
    for(ii= ii0; ii<SCREEN_HEIGHT; ii++)
    {
        yb= (ii-M7_TOP)*ct + M7_D*st;
        lam= DivSafe( yc<<12,  yb);     // .12f

        lcf= lam*cf>>8;                 // .12f
        lsf= lam*sf>>8;                 // .12f

        bga->pa= lcf>>4;                // .8f
        bga->pc= lsf>>4;                // .8f

        // lambda·Rx·b
        zb= (ii-M7_TOP)*st - M7_D*ct;   // .8f
        bga->dx= xc + (lcf>>4)*M7_LEFT - (lsf*zb>>12);  // .8f
        bga->dy= zc + (lsf>>4)*M7_LEFT + (lcf*zb>>12);  // .8f

        // hack that I need for fog. pb and pd are unused anyway
        bga->pb= lam;
        bga++;
    }
    level->bgaff[SCREEN_HEIGHT]= level->bgaff[0];
}
```

我们先取得要开始计算的扫描线（可能什么都没有），并定义_很多_临时变量。并非所有临时变量都必要，但它们让代码更易读。撇开命名不说，循环内的代码与[第一个 mode 7 演示](mode7.html#ssec-order-code)中的 `hbl_mode7_c` 非常相似，只是我们在计算 λ 时用了旋转后的 _y_<sub>s</sub> 值，而在计算偏移时用了旋转后的 _z_<sub>s</sub>（= −*D*）值。就这样。

计算后面的注释标出了结果的定点位数，本例中可能是 .8f 或 .12f。现在听好了：缩放后的 φ 的（余）弦 `lcf` 和 `lsf` 使用 12 位或更高的精度，这**非常**重要。我试过 8 位，那可不好看——近距离时位移全都错了。其次，注意位移中乘法和移位的顺序；这些顺序保持原样也非常重要。特别是涉及 _L_ 的那一个：与 `M7_LEFT` 的乘法**必须**发生在移位之后，相信我。

最后一个有趣的点是循环之后的那一行，它把扫描线 0 的参数复制到数组末尾，以补偿 HBlank 中断的 obiwan 错误。

这个函数大概是用 C 能做到的最快了，而且编译器干得相当漂亮，所以转到手工汇编也没多少可赚的。这并不意味它仍然不花相当多的时间。仅一次除法就要花费大约 100 到 400 个周期（BIOS 除法的周期数大约是 90 + 13/有效位）。每条扫描线一次除法，累积起来相当可观。应对它的最佳策略是：如果没必要就_不要做_。如果你用固定的俯仰角，可以预计算所有除法并直接查表。如果你必须要可变的俯仰角，也可以走三角函数路线。回头看 {@fig:img-obj-sort}。如果 β 是 (0, *y*<sub>p</sub>, −*D*) 和 (0, 0, −*D*) 之间的夹角，那么 tan(β) = *y*<sub>p</sub>/_D_。通过大量三角学，你可以把 λ 的公式改写成

<table id="eq:lambda-alt">
  <tr>
    <td class="eqnrcell">({!@eq:lambda-alt})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtable displaystyle="true" columnalign="right left" columnspacing="0em" rowspacing="3pt">
                    <mtr>
                      <mtd>
                        <mi>&#x3BB;</mi>
                      </mtd>
                      <mtd>
                        <mi></mi>
                        <mo>=</mo>
                        <msub>
                          <mi>a</mi>
                          <mrow data-mjx-texclass="ORD">
                            <mi>c</mi>
                            <mi>w</mi>
                            <mo>,</mo>
                            <mi>y</mi>
                          </mrow>
                        </msub>
                        <mrow data-mjx-texclass="ORD">
                          <mo>/</mo>
                        </mrow>
                        <mi>D</mi>
                        <mtext>&#xA0;</mtext>
                        <mo>&#x22C5;</mo>
                        <mi>cos</mi>
                        <mo data-mjx-texclass="NONE">&#x2061;</mo>
                        <mrow>
                          <mo data-mjx-texclass="OPEN">(</mo>
                          <mi>&#x3B2;</mi>
                          <mo data-mjx-texclass="CLOSE">)</mo>
                        </mrow>
                        <mrow data-mjx-texclass="ORD">
                          <mo>/</mo>
                        </mrow>
                        <mi>sin</mi>
                        <mo data-mjx-texclass="NONE">&#x2061;</mo>
                        <mrow>
                          <mo data-mjx-texclass="OPEN">(</mo>
                          <mi>&#x3B8;</mi>
                          <mo>+</mo>
                          <mi>&#x3B2;</mi>
                          <mo data-mjx-texclass="CLOSE">)</mo>
                        </mrow>
                      </mtd>
                    </mtr>
                  </mtable>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

你可以通过一个 160 项的 arctan 查找表（LUT）得到 β，每个扫描线一项（嘿，你甚至可以把它放进 _p_<sub>d</sub> 里！），然后再用一个 1/sin 的 LUT。不过你必须小心使用足够大的 LUT。由于 LUT 的参数是整数，β 会被截断，你会因此损失_很多_精度，尤其是在靠近地平线时。我还没真正试过三角函数路线，但我在 Excel 里做过一些基本测试，表明用一个 512/圆的 1/sin LUT，你在地平线附近的 λ 误差会远超 10%，而在其他地方误差约为 1%。鉴于此，我建议至少用 1024/圆。或者，在 LUT 项之间插值，你可以用 libtonc 的 `lu_lerp16()` 和 `lu_lerp32()` 函数。

除了走三角路线，你可能还能用若干种方式加速除法。但在你跑去优化之前，先问问自己是否真的需要它。毕竟，过早优化是万恶之源。

:::note 仿射计算的加速

最近试了三种优化。第一，ARM/IWRAM，把耗时降到了 23k−58k 周期。第二，在与 sgeos 讨论中浮现的一点重构：相机向量可以归约为更小的一组变量，节省 10−20%。第三，三角路线，能把整体降到 10−20k，甚至最多 7k−14k，取决于你是用大 LUT 得到 cos(β) 和 1/sin(θ+β)，还是用小 LUT 加线性插值。一旦你把数学、移位和符号理清，它就像魔法一样管用。

:::

#### Mode 7 的 HBlank 中断例程

为了简单起见，VDraw 期间几乎一切要发生的事都放在一个叫做 `m7_hbl_floor()` 的 HBlank isr 里。这个演示的早期版本使用了一套 VCount/HBlank 中断系统，但结果证明那比它的价值更麻烦。这也是一个 IWRAM 例程，因为它真的需要尽可能快。这个中断服务例程做以下事情：

1.  **检查 floor 范围的 vcount**。如果这条扫描线不属于地面，返回。
2.  **检查地平线的 vcount**。到达地平线扫描线时，视频模式应改变，`REG_BG2CNT` 应设为地面的设置。
3.  **复制仿射参数到 `REG_BG_AFFINE[2]`**。把_下一条_扫描线的参数复制到 `REG_BG_AFFINE[2]`，因为我们已经越过了当前扫描线。
4.  **雾效**。这里渐隐到橙色。

```c
// from tonc_core.h
//! Range check; true if xmin<=x<xmax
#define IN_RANGE(x, min, max)  ( (x) >= (min) && (x) < (max) )
```

```c
IWRAM_CODE void m7_hbl_floor()
{
    int vc= REG_VCOUNT;
    int horz= m7_level.horizon;

    // (1) Not in floor range: quit
    if(!IN_RANGE(vc, horz, SCREEN_HEIGHT) )
        return;

    // (2) Horizon: switch to mode 1; set-up bg control for floor
    if(vc == horz)
    {
        BF_SET(REG_DISPCNT, DCNT_MODE1, DCNT_MODE);
        REG_BG2CNT= m7_level.bgcnt_floor;
    }

    // (3) Looking at floor: copy affine params
    BG_AFFINE *bga= &m7_level.bgaff[vc+1];
    REG_BG_AFFINE[2] = *bga;

    // (4) A distance fogging with high marks for hack-value
    u32 ey= bga->pb*6>>12;
    if(ey>16)
        ey= 16;

    REG_BLDALPHA= BLDA_BUILD(16-ey, ey);
}
```

第 (3) 和第 (4) 点可以从多一点解释中受益。正如现在已经说过好几次，任何扫描线 _vc_ 的 isr 都应该设置_下一条_扫描线的参数，这就是为什么我们从 `level.bgaff[vc+1]` 而不是 `[vc]` 复制。扫描线零使用来自 *vc* = 160 的那一组，这没问题，因为我们已经把零的数据复制到了数组的最后一个元素。像往常一样，结构体复制 ftw。

对于雾效，我使用 _p_<sub>b</sub>，它在 `m7_prep_affines()` 中填入 λ 正是为此。缩放后的 λ 并非雾效最精确的模型，但效果看起来足够好。由于混合寄存器上限为 16，我需要确保它在更高值时不会绕回。

这_仍然_留下了一个问题：我到底在和什么混合，因为橙色并不在 GBA 的渐隐 repertoire 里。至少，不是_直接_在。不过，与远景混合是相当可能的，而远景只显示 bg-color 0。这个颜色可以是任意颜色，包括橙色。

### 精灵(对象)与对象 {#ssec-code-spr}

精灵(对象)与对象的处理分布在以下三个函数中：

- `void update_sprites()`：主精灵(对象)处理器，调用其他函数来做定位、排序和动画。
- `IWRAM_CODE void m7_prep_sprite(M7_LEVEL *level, M7_SPRITE *spr)`：计算精灵(对象)正确的位置和缩放。
- `void kart_animate(M7_SPRITE *spr, const M7_CAM *cam)`：为绕赛车旋转选择正确的帧。

只有 `m7_prep_sprite()` 真正属于 mode 7 函数；其他的很可能因你心目中的每个 mode 7 游戏而异。主精灵(对象)处理器 `update_sprites()` 相当简单：它需要对每个精灵(对象)调用 `m7_prep_sprite()` 并创建精灵(对象)的排序键，对所有精灵(对象)排序，然后把排好序的属性复制到 OAM。它还会为每个赛车精灵(对象)调用 `kart_animate()` 来做动画；如果我对 thwomp 或其他精灵(对象)也有动画，它们大概也会放到这里。

```c
void update_sprites()
{
    int ii;

    M7_SPRITE *spr= m7_level.sprites;
    for(ii=0; ii<SPR_COUNT; ii++)
    {
        m7_prep_sprite(&m7_level, &spr[ii]);

        // Create sort key
        if(BF_GET2(spr[ii].obj.attr0, ATTR0_MODE) != ATTR0_HIDE)
            sort_keys[ii]= spr[ii].pos2.z;
        else
            sort_keys[ii]= INT_MAX;
    }

    // Sort the sprites
    id_sort_shell(sort_keys, sort_ids, SPR_COUNT);

    // Animate karts
    for(ii=0; ii<8; ii++)
        kart_animate(&spr[ii], m7_level.camera);

    // Update real OAM
    for(ii=0; ii<SPR_COUNT; ii++)
        obj_copy(&oam_mem[ii], &spr[sort_ids[ii]].obj, 1);
}
```

大部分代码与排序精灵(对象)有关，这在理论中已经描述过了。精灵(对象)的 `pos2` 成员由 `m7_prep_sprite()` 设置，以包含其在相机空间中的位置。排序例程 `id_sort_shell()` 就是[优先级章节](lab.html#sec-prio)中描述的索引表排序器。

如果我想要更高级的动画或精灵(对象)功能，它们也会放在这里。但我没有，所以我也没放。

#### 精灵(对象)定位与缩放

`m7_prep_sprite()` 函数计算精灵(对象)正确的屏幕位置，用恰当的（重归一化后的）缩放设置仿射矩阵，并在它落在视体之外时隐藏它。

第一步是把精灵(对象)的世界位置转换成相机空间中的向量，使用 {@eq:obj-w2s} 的第一部分：**x**<sub>c</sub> = **C**<sup>T</sup>·**r**，其中 **r** 是精灵(对象)相对于相机的位置：**r** = **x**<sub>w</sub>−**a**<sub>cw</sub>。这被放进变量 `vc` 中，但 _y_ 和 _z_ 的符号被交换了！这让后续计算稍微容易些。这个向量也被存进 `spr->pos2`，用于别处的排序。

第二步是检查精灵(对象)是否真的可见，使用来自 {@tbl:culltest} 的条件，只有一个例外：现在的检查使用的是精灵(对象)的_重归一化_矩形。漏掉那部分可能会在某些朝向下产生瑕疵。为了计算精灵(对象)矩形，我用了对象矩形的大小。如果你再定义一个指示对象帧内可见像素的精灵(对象)矩形，可以得到更紧的贴合，但那在这里可能有点过头了。

注意，从边界检查往后的大部分代码都放在一个 `do-while(0)` 循环里。这种模式有点像穷人的 `try/catch` 块——我_本可以_在这里用 `goto`，但由于它们被认为有害，我拒绝了。无论如何，一个越界的‘异常’在这里意味着该精灵(对象)应当被隐藏，这发生在第 (5) 步。

如果我们通过了边界检查，就需要设置仿射矩阵，并通过 {@eq:anchor} 的锚定方程计算对象的位置。

```c
//! Setup an object's attr/affine with the right attributes
/*! \param level    Mode 7 level data
*   \param spr      3D sprite to calculate for
*/
IWRAM_CODE void m7_prep_sprite(M7_LEVEL *level, M7_SPRITE *spr)
{
    M7_CAM *cam= level->camera;
    VECTOR vr, vc;      // Difference and inverted-cam vector
    int sx, sy;         // Object size
    RECT rect;          // Object rectangle

    // (1) Convert to camera frame
    vec_sub(&vr, &spr->pos, &cam->pos);
    vc.x=  vec_dot(&vr, &cam->u);
    vc.y= -vec_dot(&vr, &cam->v);
    vc.z= -vec_dot(&vr, &cam->w);
    spr->pos2= vc;

    OBJ_ATTR *obj= &spr->obj;
    sx= obj_get_width(obj);
    sy= obj_get_height(obj);

    // --- Check with viewbox ---
    do
    {
        // (2a) check distance
        if(M7_NEAR*256 > vc.z || vc.z > M7_FAR*256)
            break;

        // (2b) check horizontal
        rect.l= vc.x - spr->anchor.x*(256>>M7O_NORM);
        rect.r= rect.l + sx*(256>>M7O_NORM);
        if(M7_LEFT*vc.z > rect.r*M7_D || rect.l*M7_D > M7_RIGHT*vc.z)
            break;

        // (2c) check vertical
        rect.t= vc.y - spr->anchor.y*(256>>M7O_NORM);
        rect.b= rect.t + sy*(256>>M7O_NORM);
        if(-M7_TOP*vc.z > rect.b*M7_D || rect.t*M7_D > -M7_BOTTOM*vc.z)
            break;

        // (3) Set-up affine matrix
        OBJ_AFFINE *oa= &obj_aff_mem[spr->aff_id];
        oa->pa= oa->pd= vc.z>>(M7_D_SHIFT-M7O_NORM);    // normalized lambda
        oa->pb= oa->pb= 0;

        FIXED scale= DivSafe(M7_D<<16, vc.z);   // (.16 / .8) = .8

        // (4) anchoring
        // Base anchoring equation:
        // x = q0 - s - A(p0 - s/2)
        // In this case A = 1/lam; and q0 = xc/lam
        // -> x = (xc - p0 + s/2)/lam - s + screen/2
        int xscr, yscr;
        xscr  = spr->anchor.x*256 - sx*128;             // .8
        xscr  = (vc.x - (xscr>>M7O_NORM))*scale>>16;    // .0
        xscr += -sx - M7_LEFT;

        yscr  = spr->anchor.y*256 - sy*128;             // .8
        yscr  = (vc.y - (yscr>>M7O_NORM))*scale>>16;    // .0
        yscr += -sy + M7_TOP;
        obj_unhide(obj, ATTR0_AFF_DBL);
        obj_set_pos(obj, xscr, yscr);

        return;
    }
    while(0);

    // (5) If we're here, we have an invisible sprite
    obj_hide(obj);
}
```

#### 赛车动画

围绕一个精灵(对象)做动画的基本理论很简单，即 {@eq:psi}：视角 ψ 是全局精灵(对象)角 φ<sub>o</sub>、相机角 φ<sub>c</sub> 和相机空间中到精灵(对象)的角 α 之间的差：ψ = φ<sub>o</sub>−φ<sub>c</sub>−α。这个角度转换成要使用的动画帧，就完成了。

理论上如此。

实践中有不少陷阱，尤其是 SMK 的做法。首先，看 {@fig:img-obj-frames}。这 12 帧是超级马里奥赛车给 Toad 用的。第一个复杂之处是，这只有旋转的右半边；左半边通过镜像实现。那足够简单：只要把视角 _p_<sub>a</sub> 的符号取反即可。

实践中有不少陷阱，尤其是 SMK 的做法。首先，看 {@fig:img-obj-frames}。这 12 帧是超级马里奥赛车给 Toad 用的。第一个复杂之处是，这只有旋转的右半边；左半边通过镜像实现。那足够简单：只要把视角 _p_<sub>a</sub> 的符号取反即可。

第二个问题是图块的数量。半圈 12 帧，意味着整圈 24 帧（嗯，实际上 22 帧，因为我们不需要重复正面和背面帧）。每帧 4x4=16 个图块，仅 Toad 就给出 384 个图块（而且这只是旋转动画！）。乘以 8 个完整角色集合，你就远远超出 VRAM 了。这意味着你不能一次性把所有帧载入 VRAM，再用对象的图块索引来做动画：你必须动态载入需要的帧。这就是为什么精灵(对象)结构体有一个 `tiles` 成员，指向 ROM 中完整的精灵(对象)表。

第三个复杂之处是，帧并不是均匀分布在圆上的。如果仔细看，前 8 帧对应 0° 到 90° 的角度，剩下 4 帧对应 90°−180°。背后的原因是，大多数时候你是从背面看赛车，所以给那些角度更多帧是划算的。现在，在理论中我们可以很好地计算动画帧，即 _N_·ψ/2<sup>16</sup>。然而，那依赖于有 _N_ 个相等的切片，而我们已经没有了。还是有的吗？

<div class="cblock">
  <table cellspacing=4>
    <tr valign="top">
      <td>
        <div class="cpt" style="width:392px;">
          <img src="img/mode7/toad_frames.png" id="fig:img-obj-frames" alt="animation frames">
          <br>
          <b>{*@fig:img-obj-frames}</b>：Toad 不同角度的帧。
        </div>
      </td>
      <td>
        <div class="cpt" style="width:160px;">
          <img src="img/mode7/psi_lut.png" id="fig:img-psi-lut" alt="view LUT">
          <br>
          <b>{*@fig:img-psi-lut}</b>：用 &psi; 做 16 元素 LUT 条目，而非 12 个不等分区。
        </div>
      </td>
    </tr>
  </table>
</div>

```c
const u8 cKartFrames[32]=
{
     0,  1,  2, 3, 4, 5, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
    11, 10, 10, 9, 9, 8, 8, 7, 7, 6, 5, 4, 3,  2,  1,  0,
};

//! Animate kart sprite
void kart_animate(M7_SPRITE *spr, const M7_CAM *cam)
{
    OBJ_ATTR *obj= &spr->obj;

    if(BF_GET2(obj->attr0,ATTR0_MODE) == ATTR0_HIDE)
        return;

    TILE *dst= &tile_mem[4][BF_GET(obj->attr2, ATTR2_ID)];
    s16 psi= spr->phi - cam->phi;

    // Extra arctan angle for correctness
    if(g_state & STATE_OBJ_VIEW_ATAN)
        psi -= ArcTan2(spr->pos2.z>>8, spr->pos2.x>>8);

    memcpy32(dst, &spr->tiles[cKartFrames[(psi>>11)&31]*16], 16*8);

    OBJ_AFFINE *oa= &obj_aff_mem[spr->aff_id];
    if(psi < 0)
        oa->pa= -oa->pa;
}
```

嗯，不，我们不再有相等的切片了。但我们可以用某种映射_重新制造_相等的切片。{*@fig:img-psi-lut} 展示了原理如何运作。图中共有 12 个主分区（内圆），其中 0、1、10、11 覆盖的角度空间比 2−9 更大。不过，我们也可以把圆分成 16 份（外圆），并对多个条目使用同一帧。例如，主序列的切片-0 现在由新序列的切片-0 和切片-1 覆盖。虽然可以用 if/else 块来做这个映射，但对所有人来说，用个 LUT 更轻松。这实际上还解决了我之前没提到的另外两个问题，即镜像需要对正常序列做某种反转，以及切片实际上必须偏移半个切片，这样当你正好看正前或正后方时不会出现切片切换。一个 LUT 一举解决了所有这些问题。

上面的片段展示了赛车的角-LUT 和动画例程。LUT 有 32 个条目，前 7 个和后 7 个使用单块，其余成对重复。还要注意 LUT 是对称的，这是镜像所必需的。

### 收尾：主循环及其他杂项 {#ssec-code-misc}

这个例程本身并不算漂亮，但它把活干完了。它先检查精灵(对象)是否可见，不可见就退出：看不到结果就没必要干活。精灵(对象)的相机内角度 α 需要一个 arctan。我在菜单里加了一个开关，让你可以看到带与不带 α 校正的结果，我想你会发现差别相当小。由于我总是对每个精灵(对象)使用相同的 VRAM，找到图块复制的目标很容易；找到源帧看起来有点丑，但它其实只是 ψ→切片转换和查找而已。

#### 主程序流程

在下面的片段里，你可以看到 `main()` 函数及其主要分支。`init_main()` 设置主要的 mode 7 变量，通过 `m7_init()` 初始化 `m7_level`，初始化 VBlank 和 HBlank 中断以及其它一些东西。主循环相当短。`input()` 函数负责相机的移动和菜单。

在下面的片段里，你可以看到 `main()` 函数及其主要分支。`init_main()` 设置主要的 mode 7 变量，通过 `m7_init()` 初始化 `m7_level`，初始化 VBlank 和 HBlank 中断以及其它一些东西。主循环相当短。`input()` 函数负责相机的移动和菜单。

```c
int main()
{
    init_main();

    while(1)
    {
        VBlankIntrWait();
        input();

        m7_prep_horizon(&m7_level);
        // Switch to backdrop display.
        if(m7_level.horizon > 0)
        {
            BF_SET(REG_DISPCNT, DCNT_MODE0, DCNT_MODE);
            REG_BG2CNT= m7_level.bgcnt_sky;
            REG_BLDALPHA= 16;
        }
        m7_update_sky(&m7_level);

        update_sprites();
        m7_prep_affines(&m7_level);
    }

    return 0;
}
```

#### 3D 中的运动

然后是真正的 mode 7 函数。`m7_prep_horizon()` 必须最先调用，其余的顺序相当任意。不过我建议最后调用 `m7_prep_affines()`：它是这里最昂贵的函数，但让它跑到 VDraw 时间里也没关系。这里倒不会发生这种事（我计时过主循环大约在扫描线 170−210 结束），但即便发生也没问题。

这是我想讲的最后一件事：如何在 3D 中移动物体。准确地说：如何在 3D 中做不同方式的移动；我相信有人会想知道。

3D 运动其实和 2D 运动非常相似，只是多了一个维度。人们有时觉得它难，是因为他们按角度思考，而他们_应该_按向量思考。基于向量的运动（或任何基于向量的东西）通常比用角度和三角学简单得多。这也是本章理论一直在使用向量和矩阵的原因。

这里我将研究三种不同的相机运动模式：一种使用世界坐标系，一种使用相机坐标系，还有一种介于两者之间，使其始终与地面平行。不过首先，我们来看看沿某个方向移动实际上_意味着_什么。

3D 空间中的每个物体都有自己的小坐标系，即<dfn>局部坐标系</dfn>（local frame）。它被定义为一组 3 个向量，表示局部 _x_、_y_ 和 _z_ 方向。对相机而言，我分别称它们为 **u**、**v** 和 **w**。局部矩阵只是写下这组向量的另一种方式。运动通常被定义为沿这些向量的步进。

举个例子，把你的头当作相机，用箭头表示局部轴：**u** 从你的右耳伸出，**v** 从头顶伸出，**w** 从脑后伸出。向右一步就是沿 **u** 方向，向前一步沿 −**w**。一个一般性的运动可以写成 _x_ 步向右、_y_ 步向上、_z_ 步向后。_x_、_y_、_z_ 被用作方向向量的_乘数_，而全局空间中的最终位移是 **dx** = _x_·**u** + _y_·**v** + _z_·**w**。

在我的情况下，我在 `input()` 中基于各个按键构造向量 **r**。此时它还没有真正的含义。每种运动方式都有自己的方向集合，因此也有自己必须施加到 **r** 上的矩阵；我有能执行它们并把结果加到相机位置的函数。这些都可以在 {@tbl:motion} 及其下方代码中找到。

‘level’（即与地面齐平）对地面物体的相机系统可能是最常见的，不过对飞行物体使用局部系统可能更有意义。试试它们，看看你喜欢哪种。

<div class="cblock">
  <table id="tbl:motion" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:motion}</b>：运动方法及其到世界空间的相应变换。对象的新位置由 <b>x</b><sub>w</sub> += <b>v</b><sub>w</sub> 给出。
    </caption>
    <tbody>
      <tr>
        <th>方法</th>
        <th>函数</th>
        <th>变换</th>
      </tr>
      <tr>
        <td>全局坐标系</td> 
        <td><code>m7_translate_global()</code></td>
        <td><b>dx</b> = <b>I</b> · <b>r</b> = <b>r</b>
      </tr>
      <tr>
        <td>局部（相机）坐标系</td> 
        <td><code>m7_translate_local()</code></td>
        <td><b>dx</b> = <b>C</b>(&theta;, &phi;) · <b>r</b>
      </tr>
      <tr>
        <td>Level：局部但平行于地面</td> 
        <td><code>m7_translate_level()</code></td>
        <td><b>dx</b> = <b>R</b><sub>y</sub>(&phi;) · <b>r</b>
      </tr>
    </tbody>
  </table>
</div>

```c
//! Translate by \a dir in global frame
void m7_translate_global(M7_CAM *cam, const VECTOR *dir)
{
    vec_add_eq(&cam->pos, dir);
}

//! Translate by \a dir in local frame
void m7_translate_local(M7_CAM *cam, const VECTOR *dir)
{
    cam->pos.x += (cam->u.x * dir->x + cam->v.x * dir->y + cam->w.x * dir->z) >> 8;
    cam->pos.y += ( 0                + cam->v.y * dir->y + cam->w.y * dir->z) >> 8;
    cam->pos.z += (cam->u.z * dir->x + cam->v.z * dir->y + cam->w.z * dir->z) >> 8;
}

//! Translate by \a dir using local frame for x/y, but global z
void m7_translate_level(M7_CAM *cam, const VECTOR *dir)
{
    cam->pos.x += (cam->u.x * dir->x - cam->u.z * dir->z)>>8;
    cam->pos.y += dir->y;
    cam->pos.z += (cam->u.z * dir->x + cam->u.x * dir->z)>>8;
}
```

‘level’（即与地面齐平）对地面物体的相机系统可能是最常见的，不过对飞行物体使用局部系统可能更有意义。试试它们，看看你喜欢哪种。

:::note 旁注：以精灵(对象)为中心

作为矩阵能让生活变得多轻松的一个例子，考虑把相机对准某个精灵(对象)为中心、然后绕它旋转的问题。你有相机矩阵 **C**、你想观察的距离 _Z_，以及（大概）精灵(对象)的位置 **x**<sub>w</sub>。你需要做的是：把相机移到精灵(对象)的位置，然后后退 _Z_ 步。换句话说 **a**<sub>cw</sub> = **x**<sub>w</sub>+**C**·(0, 0, _Z_)，这归结为 **a**<sub>cw</sub> = **x**<sub>w</sub>+Z**w**，

一旦你知道了相机矩阵，摆放它几乎不费吹灰之力。

:::

## 结语 {#sec-conc}

如果你对矩阵不太熟悉，它们可能看起来既耀眼又可怕，但一旦有点习惯，它们能成为救星。大型 3D 系统一刻不停地使用它们是有_原因_的；事事都靠原始三角学来做，很难，非常难。矩阵让你能在最自然的任务坐标系内工作，然后再变换到你最终需要的系统。如果你有任何与几何相关的工作，多学一点线性代数（向量和矩阵使用的规则）的基础知识，是非常值得的。

终于做完了！本章的文字解释了 mode 7 游戏最重要的元素：仿射参数的计算、加入地平线与远景、3D 精灵(对象)的定位、排序_以及_动画，外加一个如何做距离雾效的彩蛋。在前面的文字里，我用到了 Tonc 其余部分几乎每一个主题的内容，而且不只是简单的部分。如果你读到这里并理解了我们上面的大部分或全部内容，恭喜你。