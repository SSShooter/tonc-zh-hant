# 18. 哔！GBA 声音入门

<!-- toc -->

## GBA 声音简介 {#sec-intro}

除了图形和交互之外，游戏还有另一种重要的感官体验：音频。虽然画面可以布置场景，但声音能营造氛围，有时它甚至比画面更重要。试着在玩《生化危机》时配上 "Weird Al" Yankovic 的音乐：根本行不通，气氛全无。

GBA 共有六个声音通道。前四个与初代 Game Boy 基本相同：两个方波发生器（通道 1 和 2）、一个采样播放器（通道 3）和一个噪声发生器（通道 4）。它们也常被称为 DMG 通道，得名于 Game Boy 的代号 "Dot Matrix Game（点阵游戏机）"。新增的是两个 Direct Sound 通道 A 和 B（不要和微软的 DirectSound 这个 DirectX 组件混淆）。它们是 8 位的数字脉冲编码调制（PCM）通道。

我得先说明，我其实对声音编程知之甚少，主要是因为我没法真正自己拼凑出一段音乐（当你身边已经在放音乐时，这事儿可不好办）。如果你真的想学声音编程，应该去 [Belogic.com](http://www.belogic.com)（几乎所有人都是从那里获取信息的）以及 [deku.gbadev.org](https://stuij.github.io/deku-sound-tutorial/)，后者会教你如何构建一个声音混音器。这两个网站都非常棒。
<!-- as of 2023-09, belogic.com uses a self-signed certificate -->

我也许不懂太多声音创作/编程，但本质上声音是物质中的一种波；波是数学生物，而我*确实*懂一点数学，所以接下来关于方波发生器，我就来讲讲这部分。

## 声音与波 {#sec-sndwav}

设想有一片由粒子组成的汪洋，每个粒子都用小弹簧与邻居相连。现在推其中一个粒子一下。在推力方向上，弹簧被压缩后又弹回，把原来的粒子推回原位，同时把推力传给了邻居；这又压缩了下一根弹簧，把推力传给*它*的邻居，如此这般，循环往复。

这是波动行为的一个典型例子。要给涵盖所有情况的波下一个精确的定义并不容易，但本质上，<dfn>波</dfn>就是一种<dfn>被传递的扰动</dfn>。波有许多种类；两大类分别是<dfn>纵波</dfn>和<dfn>横波</dfn>，纵波的振动方向与传播方向一致，横波则与之垂直。有些波是周期性的（在时间或空间上重复出现某种图案），有些不是。有些会传播，有些则不会。

### 波 {#ssec-harmonic}

最典型的波是<dfn>谐波</dfn>。这是任何满足 {@eq:wave} 的解的函数 ψ(*x*)。变量的名字其实无关紧要，但通常它要么是空间量（*x*、*y*、*z*），要么是时间量（*t*），或者同时是这些量。通解可以在 {@eq:wave-sols} 中找到。或许我应该说"解**s**"，因为可以写成很多种形式。不过它们都是等价的，你可以用一些眼下我们不必关心的技巧在它们之间互相转换。

<!--
\dv[2]{x}\psi(x) + k^2\psi(x) = 0
-->
<table id="eq:wave">
<tbody valign="middle">
<tr>
  <td class="eqnrcell">({!@eq:wave})
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mfrac>
              <msup>
                <mrow data-mjx-texclass="ORD">
                  <mi mathvariant="normal">d</mi>
                </mrow>
                <mrow data-mjx-texclass="ORD">
                  <mn>2</mn>
                </mrow>
              </msup>
              <mrow>
                <mrow data-mjx-texclass="ORD">
                  <mi mathvariant="normal">d</mi>
                </mrow>
                <msup>
                  <mi>x</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mn>2</mn>
                  </mrow>
                </msup>
              </mrow>
            </mfrac>
            <mi>&#x3C8;</mi>
            <mo stretchy="false">(</mo>
            <mi>x</mi>
            <mo stretchy="false">)</mo>
            <mo>+</mo>
            <msup>
              <mi>k</mi>
              <mn>2</mn>
            </msup>
            <mi>&#x3C8;</mi>
            <mo stretchy="false">(</mo>
            <mi>x</mi>
            <mo stretchy="false">)</mo>
            <mo>=</mo>
            <mn>0</mn>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
</tbody>
</table>

通解（们）：

<!--
\begin{matrix}
\psi(x) & = & A \cdot cos(kx) + B \cdot sin(kx) \\
 & = & C \cdot e^{ikx} + D \cdot e^{-ikx} \\
 & = & E \cdot sin(kx + \varphi_0)
\end{matrix}
-->

<table id="eq:wave-sols">
<tr>
  <td class="eqnrcell">({!@eq:wave-sols})
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtable columnspacing="1em" rowspacing="4pt">
              <mtr>
                <mtd>
                  <mi>&#x3C8;</mi>
                  <mo stretchy="false">(</mo>
                  <mi>x</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>A</mi>
                  <mo>&#x22C5;</mo>
                  <mi>c</mi>
                  <mi>o</mi>
                  <mi>s</mi>
                  <mo stretchy="false">(</mo>
                  <mi>k</mi>
                  <mi>x</mi>
                  <mo stretchy="false">)</mo>
                  <mo>+</mo>
                  <mi>B</mi>
                  <mo>&#x22C5;</mo>
                  <mi>s</mi>
                  <mi>i</mi>
                  <mi>n</mi>
                  <mo stretchy="false">(</mo>
                  <mi>k</mi>
                  <mi>x</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>C</mi>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mi>e</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>i</mi>
                      <mi>k</mi>
                      <mi>x</mi>
                    </mrow>
                  </msup>
                  <mo>+</mo>
                  <mi>D</mi>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mi>e</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mo>&#x2212;</mo>
                      <mi>i</mi>
                      <mi>k</mi>
                      <mi>x</mi>
                    </mrow>
                  </msup>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>E</mi>
                  <mo>&#x22C5;</mo>
                  <mi>s</mi>
                  <mi>i</mi>
                  <mi>n</mi>
                  <mo stretchy="false">(</mo>
                  <mi>k</mi>
                  <mi>x</mi>
                  <mo>+</mo>
                  <msub>
                    <mi>&#x3C6;</mi>
                    <mn>0</mn>
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

<div class="cpt_fr" style="width:212px;">
<img src="./img/wave.png" id="fig:wave" alt="这是一条正弦波">

**{*@fig:wave}**: 一条谐波
</div>

一个完整的波可以用三个要素来描述。首先是<dfn>振幅</dfn> *A*，它表示最小值与最大值之间距离的一半。其次是<dfn>波长</dfn> λ，即波重复自身所需的长度（它与波数 *k*= 2π/λ 相关）。然后是<dfn>相位常数</dfn> φ<sub>0</sub>，它定义了起始点。如果波是随时间变化的，那么取代波长的是<dfn>周期</dfn> *T*、<dfn>频率</dfn> *f*=1/*T*（以及角频率 ω= 2π*f*= 2π/*T*）。你可以在 {@fig:wave} 中看到这些参数各自的含义。

波动方程一个有趣的特性是，它对 ψ 是一个线性运算。这意味着解的任意线性组合仍然是解；这就是<dfn>叠加原理</dfn>。例如，如果你有两条波 ψ<sub>1</sub> 和 ψ<sub>2</sub>，那么 Ψ = *a*ψ<sub>1</sub> + *b*ψ<sub>2</sub> 也是一条波。这听起来像是 trivial 的事，但我向你保证并非如此。非线性方程（它们也确实存在）往往让科学家们有点头疼，这一事实足以说明线性方程的价值。

### 声波 {#ssec-wave-sound}

声音也是一种波。事实上，它是物质中的一种纵性压力波，本质上就和前面提到的弹簧粒子系统一样，是一整批分子在前后运动。原则上，它既有空间结构也有时间结构，如果你想把一切都纳入考虑，事情会变得极其复杂。不过我会把它简化，只考虑两个部分：振幅 *A*，以及周期和频率 *T* 和 *f*。你可能知道，声音的音调与频率相关。人类听觉的范围在 20 Hz 到 20 kHz 之间，频率越高（也就是说波被压缩得越厉害），音调就越高。大多数声音实际上是不同波的混合体，拥有不同的振幅和频率——这正是叠加原理在起作用。有趣的是，如果你把所有这些分量加总成一个函数并画出来，它看起来就完全不再像正弦波了。更有趣的是，你还可以反过来看：取任意一个函数，把它拆解成正弦波和余弦波的叠加，从而看出你的声音含有哪些频率。这叫做傅里叶变换，我们马上就会讲到。

### 音阶 {#ssec-notes}

虽然 20 Hz 到 20 kHz 的整个范围都能被人耳听到，但音乐中只使用其中一组离散的频率，这就引出了<dfn>音阶</dfn>的概念。音阶的核心是<dfn>八度</dfn>，代表频率翻倍。每个八度被划分为若干不同的音符；西方体系中是 12 个，从 A 到 G，尽管八度的编号不知为何是从 C 开始的。第 0 八度从<dfn>中央 C</dfn>开始，其频率约为 262 Hz（另见 {@tbl:oct0}）。是的，我知道 A 到 G 之间只有 7 个字母，其余的音符是介于这些音符之间的降号和升号。这里的"12"指的是一个八度中半音的数量。音阶是**对数**的；每个半音之间相差 2<sup>1/12</sup>。嗯，差不多是这样：出于某些原因，有些音符并不完全*精确*地落在位置上。

<div class="cblock">
<table id="tbl:oct0" class="table-data">
<caption align="bottom">
  <b>{*@tbl:oct0}</b>: 第 0 八度的音符与频率
</caption>
<tbody align="center">
<tr>
  <th> 半音
  <th> 0 <th> 1 <th> 2 <th> 3 <th> 4 <th> 5
  <th> 6 <th> 7 <th> 8 <th> 9 <th>10 <th>11 
  <th> (12) 
<tr>
  <th> 名称
  <td> C <td> C# <td> D <td> D# <td> E <td> F 
  <td> F# <td> G <td> G# <td> A <td> A# <td> B 
  <td> (C)
<tr>
  <th> 频率 (Hz)
  <td> 261.7 <td> 277.2 <td> 293.7 <td> 311.2 <td> 329.7 <td> 349.3 
  <td> 370.0 <td> 392.0 <td> 415.3 <td> 440.0 <td> 466.2 <td> 493.9
  <td> (523.3)
</tbody>
</table>
</div>

### 傅里叶变换与方波 {#ssec-fourier}

傅里叶变换是一种把时域函数描述为频率分布（称为<dfn>频谱</dfn>）的方法。它也是教授们把年轻的自然科学学生吓个半死的众多手段之一。别担心，我相信你能毫发无损地读完这一节 <kbd>\>:)</kbd>。对于表现良好——或者说相当良好——的函数，你可以把它们重写为*非常*规整的函数（比如多项式、指数函数，以及波）的级数形式。例如，作为傅里叶级数，一个函数可以写成像 {@eq:fser} 那样。

<!--
f(x) = \frac{1}{2}A_0 + \sum_{n>0}A_m\cos(m{\omega}t) + \sum_{n>0}B_m\sin(m{\omega}t)
-->
<table id="eq:fser">
<tr>
  <td class="eqnrcell">({!@eq:fser})
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>f</mi>
            <mo stretchy="false">(</mo>
            <mi>x</mi>
            <mo stretchy="false">)</mo>
            <mo>=</mo>
            <mfrac>
              <mn>1</mn>
              <mn>2</mn>
            </mfrac>
            <msub>
              <mi>A</mi>
              <mn>0</mn>
            </msub>
            <mo>+</mo>
            <munder>
              <mo data-mjx-texclass="OP">&#x2211;</mo>
              <mrow data-mjx-texclass="ORD">
                <mi>n</mi>
                <mo>&gt;</mo>
                <mn>0</mn>
              </mrow>
            </munder>
            <msub>
              <mi>A</mi>
              <mi>m</mi>
            </msub>
            <mi>cos</mi>
            <mo data-mjx-texclass="NONE">&#x2061;</mo>
            <mrow>
              <mo data-mjx-texclass="OPEN">(</mo>
              <mi>m</mi>
              <mrow data-mjx-texclass="ORD">
                <mi>&#x3C9;</mi>
              </mrow>
              <mi>t</mi>
              <mo data-mjx-texclass="CLOSE">)</mo>
            </mrow>
            <mo>+</mo>
            <munder>
              <mo data-mjx-texclass="OP">&#x2211;</mo>
              <mrow data-mjx-texclass="ORD">
                <mi>n</mi>
                <mo>&gt;</mo>
                <mn>0</mn>
              </mrow>
            </munder>
            <msub>
              <mi>B</mi>
              <mi>m</mi>
            </msub>
            <mi>sin</mi>
            <mo data-mjx-texclass="NONE">&#x2061;</mo>
            <mrow>
              <mo data-mjx-texclass="OPEN">(</mo>
              <mi>m</mi>
              <mrow data-mjx-texclass="ORD">
                <mi>&#x3C9;</mi>
              </mrow>
              <mi>t</mi>
              <mo data-mjx-texclass="CLOSE">)</mo>
            </mrow>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
</table>

当然，整件事的关键在于能否求出系数 *A*<sub>m</sub> 和 *B*<sub>m</sub>。虽然推导它们对应的方程相当直接，但我把它留作读者的练习，这里只以 {@eq:ftrans} 的形式给出结果。我应该说明，傅里叶变换实际上有几种定义方式。例如，有些版本不是在 \[0,*T*\] 上积分，而是在 \[−½*T*, ½*T*\] 上；或者使用复指数而不是正弦和余弦，但归根结底它们做的都是同一件事。

<!--
\begin{matrix}
A_m & = & \frac{2}{T}\int_{0}^{T} f(t)\cos(m{\omega}t) dt \\
B_m & = & \frac{2}{T}\int_{0}^{T} f(t)\sin(m{\omega}t) dt
\end{matrix}
-->
<table id="eq:ftrans">
<tr>
  <td class="eqnrcell">({!@eq:ftrans})
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtable columnspacing="1em" rowspacing="4pt">
              <mtr>
                <mtd>
                  <msub>
                    <mi>A</mi>
                    <mi>m</mi>
                  </msub>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mfrac>
                    <mn>2</mn>
                    <mi>T</mi>
                  </mfrac>
                  <msubsup>
                    <mo data-mjx-texclass="OP">&#x222B;</mo>
                    <mrow data-mjx-texclass="ORD">
                      <mn>0</mn>
                    </mrow>
                    <mrow data-mjx-texclass="ORD">
                      <mi>T</mi>
                    </mrow>
                  </msubsup>
                  <mi>f</mi>
                  <mo stretchy="false">(</mo>
                  <mi>t</mi>
                  <mo stretchy="false">)</mo>
                  <mi>cos</mi>
                  <mo data-mjx-texclass="NONE">&#x2061;</mo>
                  <mrow>
                    <mo data-mjx-texclass="OPEN">(</mo>
                    <mi>m</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>&#x3C9;</mi>
                    </mrow>
                    <mi>t</mi>
                    <mo data-mjx-texclass="CLOSE">)</mo>
                  </mrow>
                  <mi>d</mi>
                  <mi>t</mi>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <msub>
                    <mi>B</mi>
                    <mi>m</mi>
                  </msub>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mfrac>
                    <mn>2</mn>
                    <mi>T</mi>
                  </mfrac>
                  <msubsup>
                    <mo data-mjx-texclass="OP">&#x222B;</mo>
                    <mrow data-mjx-texclass="ORD">
                      <mn>0</mn>
                    </mrow>
                    <mrow data-mjx-texclass="ORD">
                      <mi>T</mi>
                    </mrow>
                  </msubsup>
                  <mi>f</mi>
                  <mo stretchy="false">(</mo>
                  <mi>t</mi>
                  <mo stretchy="false">)</mo>
                  <mi>sin</mi>
                  <mo data-mjx-texclass="NONE">&#x2061;</mo>
                  <mrow>
                    <mo data-mjx-texclass="OPEN">(</mo>
                    <mi>m</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>&#x3C9;</mi>
                    </mrow>
                    <mi>t</mi>
                    <mo data-mjx-texclass="CLOSE">)</mo>
                  </mrow>
                  <mi>d</mi>
                  <mi>t</mi>
                </mtd>
              </mtr>
            </mtable>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
  </tbody>
  </table>
</table>

<div class="cpt_fr" style="width:212px;">
<img src="./img/sqrwave.png" id="fig:sqrwave" alt="平顶与平底之间有陡峭的跳变"><br>

**{*@fig:sqrwave}**: 一个方波
</div>

作为例子，我们来看看 {@fig:sqrwave} 中所示的方波。方波在一段时间（参数 *h*）内为高（1），然后在剩下的周期里为低（0）。它仍然是一条周期波，所以我们把它沿 *t* 轴放在哪里其实无关紧要。为了方便，我把它以峰值居中：这样它就成了一条对称波，能很好地消去*所有*反对称的正弦波。*A*<sub>0</sub>=*h*/*T*，因为它是函数的平均值，其余的 *A*<sub>m</sub> 则由 {@eq:ftrans} 得出。

<!--
A_m = \frac{2}{\pi} \cdot \frac{\sin({\pi}mh/T)}{m} = \frac{2T}{h} \cdot \frac{\sin({\pi}h/T \cdot m)}{{\pi}h/T \cdot m}
-->
<table id="eq:fsqr">
<tr>
  <td class="eqnrcell">({!@eq:fsqr})
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <msub>
              <mi>A</mi>
              <mi>m</mi>
            </msub>
            <mo>=</mo>
            <mfrac>
              <mn>2</mn>
              <mi>&#x3C0;</mi>
            </mfrac>
            <mo>&#x22C5;</mo>
            <mfrac>
              <mrow>
                <mi>sin</mi>
                <mo data-mjx-texclass="NONE">&#x2061;</mo>
                <mrow>
                  <mo data-mjx-texclass="OPEN">(</mo>
                  <mrow data-mjx-texclass="ORD">
                    <mi>&#x3C0;</mi>
                  </mrow>
                  <mi>m</mi>
                  <mi>h</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <mi>T</mi>
                  <mo data-mjx-texclass="CLOSE">)</mo>
                </mrow>
              </mrow>
              <mi>m</mi>
            </mfrac>
            <mo>=</mo>
            <mfrac>
              <mrow>
                <mn>2</mn>
                <mi>T</mi>
              </mrow>
              <mi>h</mi>
            </mfrac>
            <mo>&#x22C5;</mo>
            <mfrac>
              <mrow>
                <mi>sin</mi>
                <mo data-mjx-texclass="NONE">&#x2061;</mo>
                <mrow>
                  <mo data-mjx-texclass="OPEN">(</mo>
                  <mrow data-mjx-texclass="ORD">
                    <mi>&#x3C0;</mi>
                  </mrow>
                  <mi>h</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <mi>T</mi>
                  <mo>&#x22C5;</mo>
                  <mi>m</mi>
                  <mo data-mjx-texclass="CLOSE">)</mo>
                </mrow>
              </mrow>
              <mrow>
                <mrow data-mjx-texclass="ORD">
                  <mi>&#x3C0;</mi>
                </mrow>
                <mi>h</mi>
                <mrow data-mjx-texclass="ORD">
                  <mo>/</mo>
                </mrow>
                <mi>T</mi>
                <mo>&#x22C5;</mo>
                <mi>m</mi>
              </mrow>
            </mfrac>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
  </tbody>
  </table>
</table>

*A*<sub>m</sub> 是一个<dfn>辛格（sinc）</dfn>函数：sin(*x*)/*x*。对于较大的 *m*，它趋近于零（理应如此，因为高阶项应该相对不那么重要）；但同样有趣的是，由于正弦的存在，某些高阶项也会*消失*。每当 *m* 是 *T/h* 的整数倍时，就会发生这种情况。

## GBA 声音 {#sec-gbasnd}

### 声音寄存器 {#ssec-snd-regs}

做图形时，你只需处理两个寄存器（`REG_DISPCNT` 和 `REG_BGxCNT`）就能得到结果；而做声音时，在听到*任何*声音之前，你得先配置一大堆寄存器。每个 DMG 通道各有 2 到 3 个寄存器——有些功能相似，有些则不同。除此之外，还有四个总体控制寄存器。

说到声音，寄存器的命名方式似乎特别让人头疼。你基本能找到两套名字：一套由 `REG_SOUNDxCNT` 加上 `_L`、`_H` 和 `_X` 以一种相当随意的方式构成；另一套使用 `REG_SGxy` 和 `REG_SGCNTy` 的结构（*x*=1、2、3 或 4，*y*=0 或 1）。我觉得前者是较新的版本，这很讽刺，因为更旧的那套反而更一致。唉，算了。无论如何，我觉得这两套都不够直观，总是记不住 L/H/X 或 0/1 版本各自对应什么，所以我用了*第三*套名字，它们基于 [tepples'](https://pineight.com/gba/) 的 pin8gba.h，依我看比前两套更讲得通。

<div class="cblock">
<table id="tbl:snd-names" class="table-data">
<caption align="bottom">
  <b>{*@tbl:snd-names}</b>: 声音寄存器命名对照。
</caption>
<tr align="center">
  <th> 偏移	<th> 功能 
  <th> 旧名		<th> 新名			<th> tonc
<tr>
  <th> 60h	<td> channel 1 (sqr) sweep
  <td rowspan=2> REG_SG10	<td> SOUND1CNT_L	<td> REG_SND1SWEEP	
<tr>
  <th> 62h	<td> channel 1 (sqr) len, duty, env
  <!-- -->		<td> SOUND1CNT_H	<td> REG_SND1CNT
<tr>
  <th> 64h	<td> channel 1 (sqr) freq, on
  <td> REG_SG11	<td> SOUND1CNT_X	<td> REG_SND1FREQ
<tr>
  <th> 68h		<td> channel 2 (sqr) len, duty, env
  <td> REG_SG20	<td> SOUND2CNT_L	<td> REG_SND2CNT
<tr>
  <th> 6Ch		<td> channel 2 (sqr) freq, on
  <td> REG_SG21	<td> SOUND2CNT_H	<td> REG_SND2FREQ
<tr>
  <th> 70h		<td> channel 3 (wave) mode
  <td rowspan=2> REG_SG30	<td> SOUND3CNT_L	<td> REG_SND3SEL
<tr>
  <th> 72h		<td> channel 3 (wave) len, vol
  <!-- -->		<td> SOUND3CNT_H	<td> REG_SND3CNT
<tr>
  <th> 74h		<td> channel 3 (wave) freq, on
  <td> REG_SG31	<td> SOUND3CNT_X	<td> REG_SND3FREQ
<tr>
  <th> 78h		<td> channel 4 (noise) len, vol, env
  <td> REG_SG40	<td> SOUND4CNT_L	<td> REG_SND4CNT
<tr>
  <th> 7Ch		<td> channel 4 (noise) freq, on
  <td> REG_SG41	<td> SOUND4CNT_H	<td> REG_SND4FREQ	
<tr>
  <th> 80h	<td> DMG master control
  <td rowspan=2> REG_SGCNT0	<td> SOUNDCNT_L	<td> REG_SNDDMGCNT
<tr>
  <th> 82h	<td> DSound master control	
  <!-- -->		<td> SOUNDCNT_H	<td> REG_SNDDSCNT
<tr>
  <th> 84h	<td> sound status	
  <td> REG_SGCNT1	<td> SOUNDCNT_X	<td> REG_SNDSTAT
<tr>
  <th> 88h	<td> bias control
  <td> REG_SGBIAS	<td> SOUNDBIAS	<td> REG_SNDBIAS
</table>
</div>

"哦太好了。这又要变成那些'tegel'式的事情之一了对吧？就是*你*自以为搞出了什么又好又不一样的东西，结果后来为了和全世界保持一致又退回标准术语。是吧？"

不，我会坚持用这些名字。大概吧。希望如此。……说实话，我真不太确定 <kbd>:P</kbd>。不过这倒也不是什么大事：你只要用几个 define 或者查找替换就能在名字之间切换。总之，`REG_SNDxFREQ` 存放频率信息，`REG_SNDxCNT` 存放音量和包络之类的设置；在某些情况下，它们的位布局甚至完全一样。除了通道 1 的扫频功能外，它和通道 2 完全相同。

### 主声音寄存器 {#ssec-snd-mstr}

`REG_SNDDMGCNT`、`REG_SNDDSCNT` 和 `REG_SNDSTAT` 是主声音控制寄存器；要让任何声音工作起来，你至少得在这几个寄存器上各自设置一些位。

<div class="reg">
<table class="table-reg">
<caption class="reg">
  REG_SNDDMGCNT (SOUNDCNT_L / SGCNT0_L ) @ 0400:0080h
</caption>
<tr class="bits">
  <td>F<td>E<td>D<td>C<td>B<td>A<td>9<td>8
  <td>7<td>6 5 4<td>3<td>2 1 0
<tr class="bf">
  <td class="rclr1">R4
  <td class="rclr1">R3
  <td class="rclr1">R2
  <td class="rclr1">R1
  <td class="rclr0">L4
  <td class="rclr0">L3
  <td class="rclr0">L2
  <td class="rclr0">L1
  <td> -
  <td class="rclr3">RV
  <td> -
  <td class="rclr2">LV
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width=128>
<tr align="left"><th>位<th>名称<th>宏定义<th>描述
<tbody valign="top">
<tr class="bg0">	
  <td>0-2<td class="rclr2">LV
  <td> &nbsp;
  <td> 左声道音量
<tr class="bg1">	
  <td>4-6<td class="rclr3">RV
  <td> &nbsp;
  <td> 右声道音量
<tr class="bg0">	
  <td>8-B<td class="rclr0">L1-L4
  <td>SDMG_LSQR1, SDMG_LSQR2, SDMG_LWAVE, SDMG_LNOISE
  <td>通道 1-4 接左声道
<tr class="bg1">	
  <td>C-F<td class="rclr1">R1-R4
  <td>SDMG_RSQR1, SDMG_RSQR2, SDMG_RWAVE, SDMG_RNOISE
  <td>通道 1-4 接右声道
</tbody>
</table>
</div>

`REG_SNDDMGCNT` 控制 DMG 通道的主音量，以及哪些通道被启用。这些控制对左、右扬声器是分开的。下面是两个让寄存器操作更方便的宏。注意它们*并不*真正去设置寄存器，只是把各个标志位组合起来。

```c
#define SDMG_SQR1    0x01
#define SDMG_SQR2    0x02
#define SDMG_WAVE    0x04
#define SDMG_NOISE   0x08

#define SDMG_BUILD(_lmode, _rmode, _lvol, _rvol)    \
    ( ((_lvol)&7) | (((_rvol)&7)<<4) | ((_lmode)<<8) | ((_rmode)<<12) )

#define SDMG_BUILD_LR(_mode, _vol) SDMG_BUILD(_mode, _mode, _vol, _vol)
```

<div class="reg">
<table class="table-reg">
<caption class="reg">
  REG_SNDDSCNT (SOUNDCNT_H / SGCNT0_H) @ 0400:0082h
</caption>
<tr class="bits">
  <td>F<td>E<td>D<td>C<td>B<td>A<td>9<td>8
  <td>7 6 5 4<td>3<td>2<td> 1 0
<tr class="bf">
  <td class="rclr4">BF
  <td class="rclr3">BT
  <td class="rclr2">BL
  <td class="rclr2">BR
  <td class="rclr4">AF
  <td class="rclr3">AT
  <td class="rclr2">AL
  <td class="rclr2">AR
  <td> - 
  <td class="rclr1">BV
  <td class="rclr1">AV
  <td class="rclr0">DMGV
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width=128>
<tr align="left"><th>位<th>名称<th>宏定义<th>描述
<tbody valign="top">
<tr class="bg0">	
  <td>0-1<td class="rclr0">DMGV
  <td>SDS_DMG25, SDS_DMG50, SDS_DMG100
  <td>DMG 音量比例。
    <ul>
      <li><b>00</b>: 25%
      <li><b>01</b>: 50%
      <li><b>10</b>: 100%
      <li><b>11</b>: 禁止
    </ul>
<tr class="bg1">	
  <td> 2 <td class="rclr1">AV
  <td>SDS_A50, SDS_A100
  <td>DSound A 音量比例。清零时为 50%；置位时为 100%
<tr class="bg0">	
  <td> 3 <td class="rclr1">BV
  <td>SDS_B50, SDS_B100
  <td>DSound B 音量比例。清零时为 50%；置位时为 100%
<tr class="bg1">	
  <td>8-9<td class="rclr2">AR, AL
  <td>SDS_AR, SDS_AL
  <td><B>DSound A 启用</b> 在左右扬声器上启用 DS A
<tr class="bg0">	
  <td> A <td class="rclr3">AT
  <td>SDS_ATMR0, SDS_ATMR1
  <td><b>Dsound A 定时器</B>。使用定时器 0（清零时）或 1（置位时）
    用于 DS A
<tr class="bg1">	
  <td> B <td class="rclr4">AF
  <td>SDS_ARESET
  <td><b>Dsound A 的 FIFO 复位</b>。当使用 DMA 进行 Direct Sound 时，
    这会使 DMA 在使用后复位 FIFO 缓冲区。
<tr class="bg0">	
  <td>C-F
  <td>
    <span class="rclr2">BR, BL</span>, 
    <span class="rclr3">BT</span>, 
    <span class="rclr4">BF</span>
  <td>SDS_BR, SDS_BL, SDS_BTMR0, SDS_BTMR1, SDS_BRESET
  <td>同 8-B 位，但用于 DSound B
</tbody>
</table>
</div>

关于 `REG_SNDDSCNT` 我了解不多，只知道它管理 PCM 声音，但出于某些原因也带有一些 DMG 声音的位。`REG_SNDSTAT` 显示 DMG 通道的状态*并且*启用所有声音。如果你想让任何声音响起来，就需要把那里的第 7 位置位。

<div class="reg">
<table class="table-reg">
<caption class="reg">
  REG_SNDSTAT (SOUNDCNT_X / SGCNT1) @ 0400:0084h
</caption>
<tr class="bits">
  <td>F E D C B A 9 8
  <td>7<td>6 5 4
  <td class="rof">3<td class="rof">2<td class="rof">1<td class="rof">0
<tr class="bf">
  <td> -
  <td class="rclr0">MSE
  <td> -
  <td class="rclr1">4A
  <td class="rclr1">3A
  <td class="rclr1">2A
  <td class="rclr1">1A
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width=128>
<tr align="left"><th>位<th>名称<th>宏定义<th>描述
<tbody valign="top">
<tr class="bg0">	
  <td class="rof">0-3<td class="rclr1">1A-4A
  <td>SSTAT_SQR1, SSTAT_SQR2, SSTAT_WAVE, SSTAT_NOISE
  <td><b>活动通道</b>。指示当前正在播放的 DMG 通道。它们<i>不</i>会启用通道；
    那才是 <code>REG_SNDDMGCNT</code> 的职责。
<tr class="bg1">	
  <td> 7 <td class="rclr0">MSE
  <td>SSTAT_DISABLE, SSTAT_ENABLE
  <td><b>主声音启用</b>。如果要听到任何声音，必须置位。在干别的事<b>之前</b>
    先设置它：否则其他寄存器无法被访问，详见 GBATEK。
</tbody>
</table>
</div>

:::warning 声音寄存器访问

模拟器可能允许访问声音寄存器，即使声音被禁用（`REG_SNDSTAT`\{7\} 为 0）；但硬件不行。使用前务必先启用声音。

:::

### GBA 方波发生器 {#ssec-snd-sqr}

GBA 有两个方波声音发生器，即通道 1 和 2。它们之间唯一的区别是通道 1 的<dfn>频率扫频</dfn>，它可以让频率在播放时按指数方式上升或下降。这全部由 `REG_SND1SWEEP` 完成。`REG_SNDxCNT` 控制波的时长、包络和占空比。时长应当很好理解。<dfn>包络</dfn>本质上就是振幅随时间变化的函数：你可以让它淡入（<dfn>起音</dfn>）、保持在相同水平（<dfn>持续</dfn>），然后再淡出（<dfn>衰减</dfn>）。包络有 16 个音量等级，你可以控制起始音量、包络的方向，以及到下一次变化的时间。音量是线性的：12 产生的振幅是 6 的两倍。<dfn>占空比</dfn>指的是"高"电平时间与周期的比值，换句话说就是 *D* = *h/T*。

当然，你也可以控制频率，用的是 `REG_SNDxFREQ`。不过，你在这个字段里填的并不是频率，也不完全是周期；而是一种我称之为<dfn>速率</dfn> *R* 的量。这三个量彼此相关，却又微妙地不同，一旦混淆就会一团糟——而文档里*经常*会混淆它们，所以要小心。频率 *f* 与速率 *R* 的关系由 {@eq:fvsr} 描述；速率升高，频率也随之升高。由于 *R* ∈ \[0, 2047\]，频率范围是 \[64 Hz, 131 kHz\]。虽然这跨越了十个八度，但最高的那些用处不大，因为频率步进变得太大（公式 {@eq:fvsr} 中的分母趋近于 0）。

<!--
f(R) = \frac{2^{17}}{2048-R}
R(f) = 2048 - \frac{2^{17}}{f}
-->

<table id="eq:fvsr">
<tr>
  <td class="eqnrcell">({!@eq:fvsr}a)
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>f</mi>
            <mo stretchy="false">(</mo>
            <mi>R</mi>
            <mo stretchy="false">)</mo>
            <mo>=</mo>
            <mfrac>
              <msup>
                <mn>2</mn>
                <mrow data-mjx-texclass="ORD">
                  <mn>17</mn>
                </mrow>
              </msup>
              <mrow>
                <mn>2048</mn>
                <mo>&#x2212;</mo>
                <mi>R</mi>
              </mrow>
            </mfrac>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math><tr>
  <td class="eqnrcell">({!@eq:fvsr}b)
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>R</mi>
            <mo stretchy="false">(</mo>
            <mi>f</mi>
            <mo stretchy="false">)</mo>
            <mo>=</mo>
            <mn>2048</mn>
            <mo>&#x2212;</mo>
            <mfrac>
              <msup>
                <mn>2</mn>
                <mrow data-mjx-texclass="ORD">
                  <mn>17</mn>
                </mrow>
              </msup>
              <mi>f</mi>
            </mfrac>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
</table>

### 方波声音寄存器 {#ssec-snd-sqrreg}

两个方波发生器都有用于包络/长度/占空比控制的寄存器 `REG_SNDxCNT`，以及用于频率控制的 `REG_SNDxFREQ`。声音 1 还额外以 `REG_SND1SWEEP` 的形式拥有扫频控制。传统名称可查阅 {@tbl:snd-names}；注意，在传统命名法中，控制和频率的后缀对通道 1 和 2 是*不同*的，尽管它们的功能完全一样。

<div class="reg">
<table class="table-reg" id="tbl-reg-snd1cnt" width=420>
<caption class="reg">
<span class="nobr">
  REG_SND1CNT (SOUND1CNT_H / SG10_H) @ 0400:0062h</span>
  <br> and <br>
<span class="nobr">
  REG_SND2CNT (SOUND2CNT_L / SG20_L) @ 0400:0068h</span>
</caption>
<tr class="bits">
  <td>F E D C<td>B<td>A 9 8<td>7 6<td class="wof">5 4 3 2 1 0
<tr class="bf">
  <td class="rclr0">EIV
  <td class="rclr1">ED
  <td class="rclr2">EST
  <td class="rclr3">D
  <td class="rclr4">L
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width="12%">
<tr align="left"><th>位<th>名称<th>宏定义<th>描述
<tbody valign="top">
<tr class="bg0">	
  <td class="wof">0-5<td class="rclr4">L
  <td>SSQR_LEN#
  <td>声音<b>长度</b>。这是一个<i>只写</i>字段，仅当通道为定时模式（<code>REG_SNDxFREQ{E}</code>）时才生效。其长度实际为 (64&minus;<i>L</i>)/256 秒，范围对应 [3.9, 250] ms。
<tr class="bg1">	
  <td>6-7<td class="rclr3">D
  <td>SSQR_DUTY1_8, SSQR_DUTY1_4, SSQR_DUTY1_2, SSQR_DUTY3_4, 
    SSQR_DUTY#
  <td>波形<b>占空比</b>。方波高、低电平时间之比。回顾公式&nbsp;18.2，
	这等价于 <i>D=h/T</i>。可选周期为
	12.5%、25%、50% 和 75%（即八分之一、四分之一、二分之一和四分之三）。
<tr class="bg0">	
  <td>8-A<td class="rclr2">EST
  <td>SSQR_TIME#
  <td>包络<b>步进时间</b>。相邻两次包络变化之间的时间：
    &Delta;t = <i>EST</i>/64 s。
<tr class="bg1">	
  <td> B <td class="rclr1">ED
  <td>SSQR_DEC, SSQR_INC
  <td>包络<b>方向</b>。指示包络每一步是减小（默认）还是增大。
<tr class="bg0">	
  <td>C-F<td class="rclr0">EIV
  <td>SSQR_IVOL#
  <td>包络<b>初始值</b>。可视为某种<b>音量</b>设置：0 为静音，15 为最大音量。结合方向，你可以实现淡入和淡出；若要持续发声，可将初始音量设为 15 并取增大的方向。要改变<i>实际</i>音量，请记住
    <code>REG_SNDDMGCNT</code>。
</tbody>
</table>
</div>

<div class="cpt_fr" style="width:312px;">
<img src="./img/sqrfour.png" alt="方波的傅里叶变换" id="fig:sqrf"><br>
<b>{*@fig:sqrf}</b>: 方波频谱。
  （仅整数 <i>m</i>）
</div>

<!--
A_m = \frac{2}{\pi} \cdot \frac{sin({\pi}Dm)}{m}
-->
<table>
<tr>
  <td class="fill">&nbsp;
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <msub>
              <mi>A</mi>
              <mi>m</mi>
            </msub>
            <mo>=</mo>
            <mfrac>
              <mn>2</mn>
              <mi>&#x3C0;</mi>
            </mfrac>
            <mo>&#x22C5;</mo>
            <mfrac>
              <mrow>
                <mi>s</mi>
                <mi>i</mi>
                <mi>n</mi>
                <mo stretchy="false">(</mo>
                <mrow data-mjx-texclass="ORD">
                  <mi>&#x3C0;</mi>
                </mrow>
                <mi>D</mi>
                <mi>m</mi>
                <mo stretchy="false">)</mo>
              </mrow>
              <mi>m</mi>
            </mfrac>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
</table>

再多说一点占空比。记得我们对方波做过傅里叶分析，从而能确定其中包含的频率。除了**基频**之外，还有频率为 *m·f* 的**泛音**。频谱（见 {@fig:sqrf}）给出了所有这些频率的振幅。注意，虽然图中画出了连续的线，但 *m* 只允许取整数值。*m*=1 时的基频最重要，其余的按 1/*m* 衰减。有趣的地方在于正弦开始起作用时：每当 *m·D* 为整数，对应的分量就消失了！对于我们这种分数占空比的情况——每次 *m* 等于分母时就会发生。对于 50% 占空比，每隔一个泛音消失，于是声音相当平滑；对于 12.5%，只有每八个才消失，结果确实更"吵"。注意，对于 ¼ 和 ¾ 占空比，都是每四个消失一个，所以它们听起来应该没有区别。这个结果让我有点意外，但当我实际去听时，它们确实听起来一样。

<div class="reg">
<table class="table-reg" id="tbl-reg-snd1freq" width=420>
<caption class="reg">
<span class="nobr">
  REG_SND1FREQ (SOUND1CNT_X / SG11) @ 0400:0062h</span>
  <br> and <br>
<span class="nobr">
  REG_SND2FREQ (SOUND2CNT_H / SG21) @ 0400:006Ch</span>
</caption>
<tr class="bits">
  <td class="wof">F<td>E<td>D C B
  <td class="wof">A 9 8 7 6 5 4 3 2 1 0
<tr class="bf">
  <td class="rclr1">Re
  <td class="rclr2">T
  <td> - 
  <td class="rclr0">R
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width="12%">
<tr align="left"><th>位<th>名称<th>宏定义<th>描述
<tbody valign="top">
<tr class="bg0">	
  <td class="wof">0-A<td class="rclr0">R
  <td>SFREQ_RATE#
  <td>声音<b>速率</b>。准确地说，是初始速率。注意是<i>速率</i>，不是
    频率，也不是周期。速率与频率的关系是
    <span class="nobr"><i>f</i> =
    2<sup>17</sup><big>/</big>(2048-<i>R</i>)</span>。只写
    字段。
<tr class="bg1">	
  <td> E <td class="rclr2">T
  <td>SFREQ_HOLD, SFREQ_TIMED
  <td><b>定时</b>标志。若置位，声音按长度字段（<code>REG_SNDxCNT</code>{0-5}）指定的时长播放。
    若清零，声音将永远播放。注意，即使衰减包络已降到 0，声音本身仍被视为
    "开启"，即便它已经听不见。
<tr class="bg0">	
  <td class="wof"> F <td class="rclr1">Re
  <td>SFREQ_RESET
  <td>声音<b>复位</b>。将声音重置为初始音量（及扫频）设置。注意速率字段也在这个寄存器里，
    而且由于它是只写的，简单的
    &lsquo;<code>|= SFREQ_RESET</code>&rsquo; <i>并不</i>够用
    （尽管在模拟器上也许可以）。
</tbody>
</table>
</div><br>

<div class="reg">
<table class="table-reg" id="tbl-reg-snd1sweep" width=420>
<caption class="reg">
  REG_SND1SWEEP (SOUND1CNT_L / SG10_L) @ 0400:0060h
</caption>
<tr class="bits">
  <td>F E D C B A 9 8 7<td>6 5 4<td>3<td>2 1 0
<tr class="bf">
  <td> - 
  <td class="rclr2">T
  <td class="rclr1">M
  <td class="rclr0">N
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width="12%">
<tr align="left"><th>位<th>名称<th>宏定义<th>描述
<tbody valign="top">
<tr class="bg0">	
  <td>0-2<td class="rclr0">N
  <td>SSW_SHIFT#
  <td>扫频<b>次数</b>。<i>不是</i>扫频的步数；详见下文讨论。
<tr class="bg1">	
  <td> 3 <td class="rclr1">M
  <td>SSW_INC, SSW_DEC
  <td>扫频<b>模式</b>。扫频可以让速率上升（默认）或下降（若置位）。
<tr class="bg0">	
  <td>4-6<td class="rclr2">T
  <td>SSW_TIME#
  <td>扫频<b>步进时间</b>。相邻两次扫频之间的时间以
    128 Hz（不是 kHz！）计量：&Delta;t = <i>T</i>/128 ms &asymp; 7.8<i>T</i>
    ms；若 <i>T</i>=0，则禁用扫频。
</tbody>
</table>
</div>

我有相当的把握，大多数文档对移位具体如何工作都语焉不详，所以这里再补充几点。毫无疑问，扫频*确实*会让音高上升或下降（由第 3 位控制），步进时间*也确实*会在经过该时间后改变音高，但扫频移位到底做了什么，说得最好也只能算含糊其辞。相关信息是写在那里的，但前提是你得知道该去哪里找。通常给出的公式类似这样：

<!--
T = T \pm T\cdot2^{-n}
-->
<table>
<tr>
  <td class="fill">
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>T</mi>
            <mo>=</mo>
            <mi>T</mi>
            <mo>&#xB1;</mo>
            <mi>T</mi>
            <mo>&#x22C5;</mo>
            <msup>
              <mn>2</mn>
              <mrow data-mjx-texclass="ORD">
                <mo>&#x2212;</mo>
                <mi>n</mi>
              </mrow>
            </msup>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
</table>

这是 belogic 给出的公式，只要你明白各项的含义就没问题。与你可能读到的相反，扫频*并不*作用于频率（*f*），也*不*作用于周期（*T*，见上文），它作用的是**速率**（*R*）。如果你在模拟器里观察，会真正*看到*速率值在变化。

其次，指数里的 *n* *并不是*一直累加到扫频移位次数的当前扫频索引。它实际上就是**扫频移位次数**，而扫频会一直进行，直到速率达到 0 或最大值 2047。

你看到的公式确实说明了这一点，但它们很容易被误读。我就误读过。{*@eq:sweep} 给出了一组正确的关系。*R* 是速率，*n* 是扫频移位（{!@eq:sweep}c 解释了为什么它叫"移位"（单数，不是复数）），*j* 是当前扫频索引。你可以用多种方式来看待它们，但归根结底都是指数函数，毕竟 'd*y*(*x*) = *a·y*(*x*)d*x*' 表达的就是这个意思。例如，若 *n*=1，则递增和递减扫频分别呈现 1½<sup>j</sup> 和 ½<sup>j</sup> 的行为；若 *n*=2，则是 1¼<sup>j</sup> 和 ¾<sup>j</sup>，依此类推。移位次数越大，扫频越慢。

<!--
{\Delta}R = 2^{-n} \cdot R
-->
<table id="eq:sweep">
<tr>
  <td class="eqnrcell">({!@eq:sweep}a)
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mrow data-mjx-texclass="ORD">
              <mi mathvariant="normal">&#x394;</mi>
            </mrow>
            <mi>R</mi>
            <mo>=</mo>
            <msup>
              <mn>2</mn>
              <mrow data-mjx-texclass="ORD">
                <mo>&#x2212;</mo>
                <mi>n</mi>
              </mrow>
            </msup>
            <mo>&#x22C5;</mo>
            <mi>R</mi>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
</table>

<!--
\begin{matrix}
R_j & = & R_{j-1} \pm R_{j-1} \cdot 2^{-n} \\
    & = & R_{j-1} \cdot (1 \pm 2^{-n}) \\
    & = & R_0 \cdot (1 \pm 2^{-n})^j
\end{matrix}
-->
<table>
<tr>
  <td class="eqnrcell">({!@eq:sweep}b)
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtable columnspacing="1em" rowspacing="4pt">
              <mtr>
                <mtd>
                  <msub>
                    <mi>R</mi>
                    <mi>j</mi>
                  </msub>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msub>
                    <mi>R</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>j</mi>
                      <mo>&#x2212;</mo>
                      <mn>1</mn>
                    </mrow>
                  </msub>
                  <mo>&#xB1;</mo>
                  <msub>
                    <mi>R</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>j</mi>
                      <mo>&#x2212;</mo>
                      <mn>1</mn>
                    </mrow>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mo>&#x2212;</mo>
                      <mi>n</mi>
                    </mrow>
                  </msup>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msub>
                    <mi>R</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>j</mi>
                      <mo>&#x2212;</mo>
                      <mn>1</mn>
                    </mrow>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <mo stretchy="false">(</mo>
                  <mn>1</mn>
                  <mo>&#xB1;</mo>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mo>&#x2212;</mo>
                      <mi>n</mi>
                    </mrow>
                  </msup>
                  <mo stretchy="false">)</mo>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msub>
                    <mi>R</mi>
                    <mn>0</mn>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <mo stretchy="false">(</mo>
                  <mn>1</mn>
                  <mo>&#xB1;</mo>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mo>&#x2212;</mo>
                      <mi>n</mi>
                    </mrow>
                  </msup>
                  <msup>
                    <mo stretchy="false">)</mo>
                    <mi>j</mi>
                  </msup>
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

<table>
<tr>
  <td class="eqnrcell">({!@eq:sweep}c)
  <td class="eqcell">
    <code>R += R &gt;&gt; n;</code>
</table>

### 演奏音符 {#ssec-snd-notes}

尽管各个速率是平等的，但有些可能比另一些更"平等"。我已经给出了一张表，列出了第 0 八度标准音符的频率（{@tbl:oct0}）。你当然可以通过 {@eq:fvsr}b 把它们换算成速率并直接使用。不过，弄清楚如何演奏*所有*八度的音符也许更划算。

为此，我们会用到我在 18.2.3 节提到的关于音阶构成的若干事实。虽然我*可以*利用相邻音符之间的对数关系（Δ*f*=2<sup>1/12</sup>·*f*），但我只采用一点：不同八度之间的音符相差两倍的频率。我们还需要速率-频率关系（这显而易见）。这就是你需要的基本信息，等我们把数学推完再作更多解释。没错，还有更多数学，但我保证这是本页最后一部分了。

我们要从通用频率方程和速率-频率关系开始。其中涉及速率 *R*、频率 *f* 和八度 *c*。我们还有一个基准八度 *C*，以及该基准八度中的频率 *F*。

<!--
\begin{matrix}
f(F, c) & = & F \cdot 2^{c - C} \\
R(F, c) & = & 2^{11} - \frac{2^{17}}{f(F, c)}
\end{matrix}
-->
<table>
<tr>
  <td class="fill">&nbsp;
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtable columnspacing="1em" rowspacing="4pt">
              <mtr>
                <mtd>
                  <mi>f</mi>
                  <mo stretchy="false">(</mo>
                  <mi>F</mi>
                  <mo>,</mo>
                  <mi>c</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>F</mi>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mi>c</mi>
                      <mo>&#x2212;</mo>
                      <mi>C</mi>
                    </mrow>
                  </msup>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>R</mi>
                  <mo stretchy="false">(</mo>
                  <mi>F</mi>
                  <mo>,</mo>
                  <mi>c</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mn>11</mn>
                    </mrow>
                  </msup>
                  <mo>&#x2212;</mo>
                  <mfrac>
                    <msup>
                      <mn>2</mn>
                      <mrow data-mjx-texclass="ORD">
                        <mn>17</mn>
                      </mrow>
                    </msup>
                    <mrow>
                      <mi>f</mi>
                      <mo stretchy="false">(</mo>
                      <mi>F</mi>
                      <mo>,</mo>
                      <mi>c</mi>
                      <mo stretchy="false">)</mo>
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
</table>

接下来是神奇的部分。而且你*被期望*能理解这个。

<!--
\begin{matrix}
R(F, c) & = & 2^{11} - \frac{2^{17}}{f(F, c)} \\
        & = & 2^{11} - \frac{2^{17}}{F \cdot 2^{c - C}} \\
        & = & 2^{11} - \frac{2^{17 + C - c}}{F} \\
        & = & 2^{11} - \frac{1}{F} \cdot 2^{17 + C + m - (c + m)}  \\
        & = & 2^{11} - \frac{2^{17 + C + m}}{F} \cdot 2^{ - (c + m)}
\end{matrix}
-->
<table id="eq:noterate">
<tr>
  <td class="eqnrcell">({!@eq:noterate})
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtable columnspacing="1em" rowspacing="4pt">
              <mtr>
                <mtd>
                  <mi>R</mi>
                  <mo stretchy="false">(</mo>
                  <mi>F</mi>
                  <mo>,</mo>
                  <mi>c</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mn>11</mn>
                    </mrow>
                  </msup>
                  <mo>&#x2212;</mo>
                  <mfrac>
                    <msup>
                      <mn>2</mn>
                      <mrow data-mjx-texclass="ORD">
                        <mn>17</mn>
                      </mrow>
                    </msup>
                    <mrow>
                      <mi>f</mi>
                      <mo stretchy="false">(</mo>
                      <mi>F</mi>
                      <mo>,</mo>
                      <mi>c</mi>
                      <mo stretchy="false">)</mo>
                    </mrow>
                  </mfrac>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mn>11</mn>
                    </mrow>
                  </msup>
                  <mo>&#x2212;</mo>
                  <mfrac>
                    <msup>
                      <mn>2</mn>
                      <mrow data-mjx-texclass="ORD">
                        <mn>17</mn>
                      </mrow>
                    </msup>
                    <mrow>
                      <mi>F</mi>
                      <mo>&#x22C5;</mo>
                      <msup>
                        <mn>2</mn>
                        <mrow data-mjx-texclass="ORD">
                          <mi>c</mi>
                          <mo>&#x2212;</mo>
                          <mi>C</mi>
                        </mrow>
                      </msup>
                    </mrow>
                  </mfrac>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mn>11</mn>
                    </mrow>
                  </msup>
                  <mo>&#x2212;</mo>
                  <mfrac>
                    <msup>
                      <mn>2</mn>
                      <mrow data-mjx-texclass="ORD">
                        <mn>17</mn>
                        <mo>+</mo>
                        <mi>C</mi>
                        <mo>&#x2212;</mo>
                        <mi>c</mi>
                      </mrow>
                    </msup>
                    <mi>F</mi>
                  </mfrac>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mn>11</mn>
                    </mrow>
                  </msup>
                  <mo>&#x2212;</mo>
                  <mfrac>
                    <mn>1</mn>
                    <mi>F</mi>
                  </mfrac>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mn>17</mn>
                      <mo>+</mo>
                      <mi>C</mi>
                      <mo>+</mo>
                      <mi>m</mi>
                      <mo>&#x2212;</mo>
                      <mo stretchy="false">(</mo>
                      <mi>c</mi>
                      <mo>+</mo>
                      <mi>m</mi>
                      <mo stretchy="false">)</mo>
                    </mrow>
                  </msup>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mn>11</mn>
                    </mrow>
                  </msup>
                  <mo>&#x2212;</mo>
                  <mfrac>
                    <msup>
                      <mn>2</mn>
                      <mrow data-mjx-texclass="ORD">
                        <mn>17</mn>
                        <mo>+</mo>
                        <mi>C</mi>
                        <mo>+</mo>
                        <mi>m</mi>
                      </mrow>
                    </msup>
                    <mi>F</mi>
                  </mfrac>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mn>2</mn>
                    <mrow data-mjx-texclass="ORD">
                      <mo>&#x2212;</mo>
                      <mo stretchy="false">(</mo>
                      <mi>c</mi>
                      <mo>+</mo>
                      <mi>m</mi>
                      <mo stretchy="false">)</mo>
                    </mrow>
                  </msup>
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

好，现在说*为什么*这东西有用。记住 GBA 没有硬件除法或浮点支持，所以我们只能使用整数以及（尽可能）移位。这正是 {@eq:noterate} 最后一步中最后一项被单独分出来的原因。含有 *F* 的项给出基准八度的速率偏移，我们需要把它除以（读作：移位）不同八度的八度偏移项。记住整数除法会截断，所以为了最高精度，我们需要一个很大的分子。这可以用一个较大的 *C* 再加上一个额外的项 *m* 来实现。本质上，这使它成为一个 *m*f 的定点数除法。可用的八度范围是 −2 到 5，因此我们取 *C*=5。*m* 的取值*几乎*任意，但必须高于 2，因为最小八度是 −2，而移位永远不能为负。*m*=4 就足够了。

注意里面*仍然*有一个除法。所幸 *F* 只有十二种取值，所以不妨把整个项存进一个查找表里。最终结果就是下面的代码清单 18.1。

<div id="cd-snd-rate">

```c
// Listing 18.1: a sound-rate macro and friends

typedef enum 
{
    NOTE_C=0, NOTE_CIS, NOTE_D,   NOTE_DIS, 
    NOTE_E,   NOTE_F,   NOTE_FIS, NOTE_G, 
    NOTE_GIS, NOTE_A,   NOTE_BES, NOTE_B
} eSndNoteId;

// Rates for equal temperament notes in octave +5
const u32 __snd_rates[12]=
{
    8013, 7566, 7144, 6742, // C , C#, D , D#
    6362, 6005, 5666, 5346, // E , F , F#, G
    5048, 4766, 4499, 4246  // G#, A , A#, B
};

#define SND_RATE(note, oct) ( 2048-(__snd_rates[note]>>(4+(oct))) )

// sample use: note A, octave 0
    REG_SND1FREQ= SFREQ_RESET | SND_RATE(NOTE_A, 0);
```
</div>

这里有几组用于音符索引的常量、存放速率偏移的查找表 `__snd_rates`，以及一个能直接给出所需结果的简单宏。虽然这里的 `__snd_rates` 是常量，你也可以考虑用一个非常量版本来允许调音。倒不是方波有什么值得调音的，但我只是说……你懂的。

一个可能的麻烦是，你得把音符拆分成音符部分和八度部分，而要动态完成这件事，你需要除以 12 并取模。或者，真的需要吗？如果你了解一些[除以常数等于乘以其倒数](fixed.html#sec-rmdiv)的知识，就会知道该怎么做。（<span class="small">提示：*c*=(*N*\*43\>\>9)−2，其中 *N* 是 0 到 95 之间的总音符索引（八度 −2 到 +5）。</span>）

## 演示时间 {#sec-demo}

我觉得今天的理讲到这儿也差不多了；你说呢，亲爱的读者？

“ \@\_@ ”

我就当你说是了。这个演示程序展示了本章各种宏的用法，尤其是 `SND_RATE`。它也演示了如何用一个方波发生器演奏一小段曲子——我用"曲子"这个词是很谦虚的。希望你能听出是哪一首。

<pre><code class="language-c hljs">#include &lt;stdio.h&gt;
#include &lt;tonc.h&gt;

u8 txt_scrolly= 8;

const char *names[]=
{   "C ", "C#", "D ", "D#", "E ", "F ", "F#", "G ", "G#", "A ", "A#", "B "  };

// === FUNCTIONS ======================================================

// Show the octave the next note will be in
void note_prep(int octave)
{
    char str[32];
    siprintf(str, "[  %+2d]", octave);
    se_puts(8, txt_scrolly, str, 0x1000);
}


// Play a note and show which one was played
void note_play(int note, int octave)
{
    char str[32];

    // Clear next top and current rows
    SBB_CLEAR_ROW(31, (txt_scrolly/8-2)&31);
    SBB_CLEAR_ROW(31, txt_scrolly/8);   

    // Display note and scroll
    siprintf(str, "%02s%+2d", names[note], octave);
    se_puts(16, txt_scrolly, str, 0);

    txt_scrolly -= 8;
    REG_BG0VOFS= txt_scrolly-8;

    // Play the actual note
    <span class="bold">REG_SND1FREQ = SFREQ_RESET | SND_RATE(note, octave);</span>
}


// Play a little ditty
void sos()
{
    const u8 lens[6]= { 1,1,4, 1,1,4 };
    const u8 notes[6]= { 0x02, 0x05, 0x12,  0x02, 0x05, 0x12 };
    int ii;
    for(ii=0; ii&lt;6; ii++)
    {
        note_play(notes[ii]&15, notes[ii]&gt;&gt;4);
        VBlankIntrDelay(8*lens[ii]);
    }
}

int main()
{
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0;

    irq_init(NULL);
    irq_add(II_VBLANK, NULL);

    txt_init_std();
    txt_init_se(0, BG_CBB(0) | BG_SBB(31), 0, CLR_ORANGE, 0);
    pal_bg_mem[0x11]= CLR_GREEN;

    int octave= 0;

    // turn sound on
    <span class="bold">REG_SNDSTAT= SSTAT_ENABLE;</span>
    // snd1 on left/right ; both full volume
    <span class="bold">REG_SNDDMGCNT = SDMG_BUILD_LR(SDMG_SQR1, 7);</span>
    // DMG ratio to 100%
    <span class="bold">REG_SNDDSCNT= SDS_DMG100;</span>

    // no sweep
    <span class="bold">REG_SND1SWEEP= SSW_OFF;</span>
    // envelope: vol=12, decay, max step time (7) ; 50% duty
    <span class="bold">REG_SND1CNT= SSQR_ENV_BUILD(12, 0, 7) | SSQR_DUTY1_2;</span>
    REG_SND1FREQ= 0;

    sos();

    while(1)
    {
        VBlankIntrWait();
        key_poll();

        // Change octave:
        octave += bit_tribool(key_hit(-1), KI_R, KI_L);
        octave= wrap(octave, -2, 6);
        note_prep(octave);

        // Play note
        if(key_hit(KEY_DIR|KEY_A))
        {
            if(key_hit(KEY_UP))
                note_play(NOTE_D, octave+1);
            if(key_hit(KEY_LEFT))
                note_play(NOTE_B, octave);
            if(key_hit(KEY_RIGHT))
                note_play(NOTE_A, octave);
            if(key_hit(KEY_DOWN))
                note_play(NOTE_F, octave);
            if(key_hit(KEY_A))
                note_play(NOTE_D, octave);
        }

        // Play ditty
        if(key_hit(KEY_B))
            sos();      
    }
    return 0;
}
</code></pre>

`main()` 中加粗的代码初始化了声音寄存器；没什么花哨的，但在听到任何声音之前必须这么做。重要的是要先设置 `REG_SNDSTAT` 的第 7 位（`SSTAT_ENABLE`），也就是主声音使能。没有它，你连其他寄存器都无法访问。当然，把音量设成非零也是个好主意。接着我们关闭扫频功能，并把声音 1 设为使用带淡出包络、50% 占空比。乐趣由此开始。

我稍后会解释 `sos()` 是什么；但先说说这个演示程序的操作方式。你可以用方向键和 A 键演奏音符（嗯，这个组合有点眼熟）。你所在的八度 *c* 可以用 L 和 R 来改变；背景颜色也会随之变化。B 键会再次播放 `sos()`。

<div class="lblock">
  <table>
    <tbody valign="top">
      <tr>
        <th>A / 方向键 <td>演奏一个音符
          <tr><td><td>&uarr; : D（高八度）
          <tr><td><td>&larr; : B
          <tr><td><td>&rarr; : A
          <tr><td><td>&darr; : F
          <tr><td><td> A     : D
      <tr>
        <th>L / R <td> 减小 / 增大当前八度（[-2, 5]，循环）
      <tr>
        <th> B    <td>演奏一小段曲子。
    </tbody>
  </table>
</div>

方向键和 A 键用于选择要演奏的音符，由 `note_play()` 处理。其中加粗的那一行才真正演奏音符，其余的都是额外内容，把刚演奏的音符写到屏幕上并随之滚动，好让你看到已经演奏过的历史。这部分代码有点丑，但它并不是故事的核心，所以没关系。

### 演奏一小段曲子 {#ssec-demo-ditty}

那么 `sos()` 到底是怎么回事呢？我们再来看一看。

```c
void sos()
{
    const u8 lens[6]= { 1,1,4, 1,1,4 };
    const u8 notes[6]= { 0x02, 0x05, 0x12,  0x02, 0x05, 0x12 };
    int ii;
    for(ii=0; ii<6; ii++)
    {
        note_play(notes[ii]&15, notes[ii]>>4);
        VBlankIntrDelay(8*lens[ii]);
    }
}
```

这里有两个数组，`notes` 和 `lens`，以及一个遍历所有元素的循环。我们从 `notes` 中取出一个字节，用它的两个半字节分别表示八度和音符信息，演奏该音符，然后等待一会儿——时长由 `lens` 数组指定——再演奏下一个音符。本质上，我们就是在演奏音乐。嘿，既然 *Schnappi* 和 *Crazy Frog* 之流都能进排行榜前十，我觉得我也有资格把*这*称为音乐，行吧？行吧。

我想说明的是，仅靠音发生器就完全有可能演奏出一段旋律。从技术上讲，你并不需要数字化音乐以及那些花里胡哨的东西才能发声。当然，用了数字化音乐会更好听，但如果你只是需要一段小小的提示音，音发生器也许就足够了。十二年的 Game Boy 游戏只用音发生器就证明了这一点。只要定义一些音符（用半字节格式表示八度和音符即可）和若干时长，你就已经掌握了基础。你甚至可以使用多个通道来实现不同的效果。

如果你理解了这一点，那么请记住：音符+长度+通道的思路，基本上就是追踪音乐（mod、it、xm 等）在做的事，只是它们使用的波形比方波更复杂。但原理是相同的。要让它真正跑起来需要多花一点功夫，而这正是 Deku 的[声音混音教程](https://stuij.github.io/deku-sound-tutorial/)所要讲的内容。
