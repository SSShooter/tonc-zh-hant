# C. 向量与矩阵

<!-- toc -->

## 向量 {#sec-vec}

在解释向量是什么之前，我首先要告诉你它不是什么。通常，你会把物理量分为<dfn>标量</dfn>（scalar）和<dfn>向量</dfn>（vector）。<dfn>标量</dfn>表示某个量的大小，就是一个单独的数字，就像你每天用的那些数字一样。质量、能量和体积都是标量的例子。而<dfn>向量</dfn>既有大小_又_有方向，通常用多个数字表示：每一维对应一个数字。位置、动量和力都是最典型的例子。另外请注意，速度是向量，而速率不是。50 公里/小时不是向量；沿 60 号公路以 50 公里/小时行驶才是向量。向量的记法是用粗体字符（通常为小写），可以写成括号括起来的一组数字，如 **u** = (1, 4, 9)，也可以写成 M×1 的列。没错，我说的确实是列，不是行；等讲到矩阵时你就明白原因了。

<table id="eq:vec-def">
  <tr>
    <td class="eqnrcell">({!@eq:vec-def})</td>
    <td>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">u</mtext>
                  <mo>&#x2261;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mn>1</mn>
                          </msub>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mo>:</mo>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mi>m</mi>
                          </msub>
                        </mtd>
                      </mtr>
                    </mtable>
                    <mo data-mjx-texclass="CLOSE">]</mo>
                  </mrow>
                  <mo>&#x2261;</mo>
                  <mo stretchy="false">(</mo>
                  <msub>
                    <mi>u</mi>
                    <mn>1</mn>
                  </msub>
                  <mo>,</mo>
                  <mo>&#x22EF;</mo>
                  <mo>,</mo>
                  <msub>
                    <mi>u</mi>
                    <mi>m</mi>
                  </msub>
                  <mo stretchy="false">)</mo>
                  <mo>&#x2262;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mn>1</mn>
                          </msub>
                        </mtd>
                        <mtd>
                          <mo>&#x22EF;</mo>
                        </mtd>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mi>m</mi>
                          </msub>
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

<div class="cpt_fr" style="width:128px">
  <img src="img/math/crd_vec.png" id="fig:img-vec"
    alt="向量与点"><br>
  <b>{*@fig:img-vec}</b>: 向量与点的区别。
</div>

如果你有一个坐标系，向量通常用来表示该坐标系中的一个空间点，向量的各元素即为坐标。然而，点和向量之间有一个关键区别：点总是相对于某个原点而言的，而向量可以独立于任何原点。右侧的{*@fig:img-vec}说明了这一点。你有点 *P* 和 *Q*，以及向量 **u、v、w**。向量 **u** 和 **v** 是相等的（它们长度和方向都相同）。但是，虽然 **u** 和它指向的点(*P*)坐标相同，这对 **v** 和 *Q* 却不成立。实际上，*Q* = **u** + **w**。更精确地说，*Q* = *O* + **u** + **w**，这就把原点(*O*)显式地写进了方程里。

## 向量运算 {#sec-vec-ops}

向量运算与标量运算类似，但多维特性确实会带来一些复杂情况，尤其是在乘法方面。请注意，向量乘法至少有三种，所以要留心。在右侧你可以看到向量加法和标量-向量乘法的例子。**u** = (8, 3)、**v** = (-4, 4)。根据下面给出的运算定义，你应该能求出其他向量。

### 向量与向量相加和相减 {#ssec-vec-add}

<div class="cpt_fr" style="width:160px">
  <img src="img/math/crd_vec_ops.png" id="fig:img-vec-ops" alt="向量运算">
  <br>
  <b>{*@fig:img-vec-ops}</b>: 向量加法与标量-向量乘法。
</div>

对于加法和减法，两个操作数都必须是 M 维向量。结果也是一个 M 维向量，其各元素是操作数对应元素的和或差：令 **w = u + v**，则有 _w_<sub>i</sub> = _u_<sub>i</sub> + _v_<sub>i</sub>。

<table id="eq:vec-add">
  <tr>
    <td class="eqnrcell">({!@eq:vec-add})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">w</mtext>
                  <mo>=</mo>
                  <mtext mathvariant="bold">u + v</mtext>
                  <mo>&#x2261;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mn>1</mn>
                          </msub>
                          <mo>+</mo>
                          <msub>
                            <mi>v</mi>
                            <mn>1</mn>
                          </msub>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mo>:</mo>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mi>m</mi>
                          </msub>
                          <mo>+</mo>
                          <msub>
                            <mi>v</mi>
                            <mi>m</mi>
                          </msub>
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

### 标量-向量乘法 {#ssec-vec-scale}

这是第一种向量乘法。如果你有一个标量 _a_ 和一个向量 **u**，标量-向量乘法得到的结果向量，其元素是原向量各元素分别乘以该标量。因此若 **v** = _c_ **u**，则 _v_<sub>i</sub> = _c_·_u_<sub>i</sub>。注意，**u** 和 **v** 位于同一条直线上——只是长度不同。另外，减法也可以写成 **w** = **u** − **v** = **u** + (−1)·**v**。

<table id="eq:vec-scale">
  <tr>
    <td class="eqnrcell">({!@eq:vec-scale})</td>
    <td class="eqcell"> 
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">v</mtext>
                  <mo>=</mo>
                  <mi>c</mi>
                  <mtext mathvariant="bold">u</mtext>
                  <mo>&#x2261;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mi>c</mi>
                          <mo>&#x22C5;</mo>
                          <msub>
                            <mi>u</mi>
                            <mn>1</mn>
                          </msub>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mo>:</mo>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mi>c</mi>
                          <mo>&#x22C5;</mo>
                          <msub>
                            <mi>u</mi>
                            <mi>m</mi>
                          </msub>
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

### 点积（即标量积） {#ssec-vec-dot}

第二种向量乘法是点积，它输入两个向量，输出却是一个标量。记法为 _c_ = **u · v**，其中 **u** 和 **v** 是向量，_c_ 是结果标量。注意运算符是一个点，这正是这种乘法的名称由来。计算点积时，把两个向量的对应元素相乘，再把所有乘积加起来。换句话说：

<table id="eq:vec-dot">
  <tr>
    <td class="eqnrcell">({!@eq:vec-dot})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>c</mi>
                  <mo>=</mo>
                  <mtext mathvariant="bold">u</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext mathvariant="bold">v</mtext>
                  <mo>=</mo>
                  <munderover>
                    <mo data-mjx-texclass="OP">&#x2211;</mo>
                    <mrow data-mjx-texclass="ORD"></mrow>
                    <mrow data-mjx-texclass="ORD"></mrow>
                  </munderover>
                  <msub>
                    <mi>u</mi>
                    <mi>i</mi>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <msub>
                    <mi>v</mi>
                    <mi>i</mi>
                  </msub>
                  <mo>=</mo>
                  <msub>
                    <mi>u</mi>
                    <mn>1</mn>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <msub>
                    <mi>v</mi>
                    <mn>1</mn>
                  </msub>
                  <mo>+</mo>
                  <mo>&#x22EF;</mo>
                  <mo>+</mo>
                  <msub>
                    <mi>u</mi>
                    <mi>m</mi>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <msub>
                    <mi>v</mi>
                    <mi>m</mi>
                  </msub>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

现在这看起来可能像是个无用的运算，但它其实非常有用。首先，向量的长度就可以通过它与自身的点积来计算。而且你还能用点积求一个向量在另一个向量上的投影，这在你试图把向量分解为其他向量的线性组合，或者确定 M 维空间的基向量时（对啥做啥？！？别担心，稍后我会解释）是无价之宝。点积最常见的用途之一是求两个向量之间的夹角。若你有向量 **u** 和 **v**，**|u|** 和 **|v|** 分别是它们的长度，α 是两者夹角，则夹角余弦可通过下式求得：

<div class="cpt_fr" style="width:112px">
  <img src="img/math/crd_dot.png" id="fig:img-vec-dot" alt="点积">
  <br>
  <b>{*@fig:img-vec-dot}</b>: 点积。
</div>

<table id="eq:vec-cos">
  <tr>
    <td class="eqnrcell">({!@eq:vec-cos})</td>
    <td class="eqcell"> 
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>cos</mi>
                  <mo data-mjx-texclass="NONE">&#x2061;</mo>
                  <mrow>
                    <mo data-mjx-texclass="OPEN">(</mo>
                    <mi>&#x3B1;</mi>
                    <mo data-mjx-texclass="CLOSE">)</mo>
                  </mrow>
                  <mo>=</mo>
                  <mfrac>
                    <mrow>
                      <mtext mathvariant="bold">u</mtext>
                      <mo>&#x22C5;</mo>
                      <mtext mathvariant="bold">v</mtext>
                    </mrow>
                    <mrow>
                      <mtext mathvariant="bold">|u|</mtext>
                      <mtext>&#xA0;</mtext>
                      <mtext mathvariant="bold">|v|</mtext>
                    </mrow>
                  </mfrac>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

为什么这样可行？你可以用多种方法证明，但这里是最优雅的一种（感谢 Ash 提醒）。记住，向量长度的平方等于它与自身的点积。也就是说 ‖**v−u**‖² = ‖**v**‖² + ‖**u**‖² − 2·**u·v**。根据{@fig:img-vec-dot}中三角形的余弦定理，我们还有 ‖**v−u**‖² = ‖**v**‖² + ‖**u**‖² − 2·‖**v**‖·‖**u**‖·cos(α)。把这两个关系式结合起来，立刻就能得到{@eq:vec-cos}。可还有人说数学难。

顺便说一句，你不仅能用它求夹角，还能很方便地判断某个东西是否在你的身后。若 **u** 是视线方向、**v** 是指向某物体的向量，当夹角大于 90° 时 **u · v** 为负值。它在视野检测，以及判断向量是否垂直（**u · v** = 0）时也很有用。在物理中你还会大量用到点积，例如力的分解，以及对力做路径积分求势能。基本上，每当物理方程里出现余弦，它很可能就是点积的结果。

### 叉积（即向量积） {#ssec-vec-cross}

叉积是一种特殊乘积，只在三维空间中成立。叉积取两个向量 **u** 和 **v**，结果为同时垂直于两者的向量 **w**。**w** 的长度就是两个操作数向量所张成的平行四边形的面积。记法为：**w** = **u** × **v**，这正是它叫叉积的原因。**w** 的各元素为 _w_<sub>i</sub> = _ε_<sub>ijk</sub>·_u_<sub>j</sub>·_v_<sub>k</sub>，其中 _ε_<sub>ijk</sub> 是列维-奇维塔符号（对 _i,j,k_ 的偶排列取 +1，奇排列取 −1，若有任意两个下标相等则取 0）。鉴于你可能从没见过这东西（为了你 sanity，最好保持这样），它的完整展开写在{@eq:vec-dot}里。

<div class="cpt_fr" style="width:176px">
  <img src="img/math/crd_cross.png" id="fig:img-vec-cross" alt="叉积">
  <br>
  <b>{*@fig:img-vec-cross}</b>: 叉积。
</div>

<table id="eq:vec-cross">
  <tr>
    <td class="eqnrcell">({!@eq:vec-cross})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">w</mtext>
                  <mo>=</mo>
                  <mtext mathvariant="bold">u</mtext>
                  <mtext>&#xA0;</mtext>
                  <mo>&#xD7;</mo>
                  <mtext>&#xA0;</mtext>
                  <mtext mathvariant="bold">v</mtext>
                  <mo>&#x2261;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mi>y</mi>
                          </msub>
                          <msub>
                            <mi>v</mi>
                            <mi>z</mi>
                          </msub>
                          <mo>&#x2212;</mo>
                          <msub>
                            <mi>u</mi>
                            <mi>z</mi>
                          </msub>
                          <msub>
                            <mi>v</mi>
                            <mi>y</mi>
                          </msub>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mi>z</mi>
                          </msub>
                          <msub>
                            <mi>v</mi>
                            <mi>x</mi>
                          </msub>
                          <mo>&#x2212;</mo>
                          <msub>
                            <mi>u</mi>
                            <mi>x</mi>
                          </msub>
                          <msub>
                            <mi>v</mi>
                            <mi>z</mi>
                          </msub>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <msub>
                            <mi>u</mi>
                            <mi>x</mi>
                          </msub>
                          <msub>
                            <mi>v</mi>
                            <mi>y</mi>
                          </msub>
                          <mo>&#x2212;</mo>
                          <msub>
                            <mi>u</mi>
                            <mi>y</mi>
                          </msub>
                          <msub>
                            <mi>v</mi>
                            <mi>x</mi>
                          </msub>
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

在{@fig:img-vec-cross}中你能看到叉积的作用示意图；这是一张三维图，所以得稍微动用一下想象力。向量 **u** 和 **v** 定义了一个平行四边形（黄色）。叉积向量 **w** 同时垂直于两者，这一事实可由 **u·w** 和 **v·w** 得出。**w** 的长度即该平行四边形的面积 _A_，如果你还记得面积公式，就会意识到：

<table id="eq:vec-sin">
  <tr>
    <td class="eqnrcell">({!@eq:vec-sin})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>A</mi>
                  <mo>=</mo>
                  <mo stretchy="false">|</mo>
                  <mtext mathvariant="bold">u</mtext>
                  <mtext>&#xA0;</mtext>
                  <mo>&#xD7;</mo>
                  <mtext>&#xA0;</mtext>
                  <mtext mathvariant="bold">v</mtext>
                  <mo stretchy="false">|</mo>
                  <mo>=</mo>
                  <mtext mathvariant="bold">&#xA0;|u|</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext mathvariant="bold">|v|</mtext>
                  <mo>&#x22C5;</mo>
                  <mi>sin</mi>
                  <mo data-mjx-texclass="NONE">&#x2061;</mo>
                  <mrow>
                    <mo data-mjx-texclass="OPEN">(</mo>
                    <mi>&#x3B1;</mi>
                    <mo data-mjx-texclass="CLOSE">)</mo>
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

也就是说，你可以用叉积求出两个向量夹角的正弦值。注意叉积是_反_交换的！即 **u × v** = −**v × u**。注意到负号了吗？这其实引出了一个要点：由 **u** 和 **v** 定义的平面，其法向量指向'上'；可你怎么确定'上'是哪个方向呢？我通常的做法是：取一个标准的三维坐标系（就像{@fig:img-vec-cross}右下角的那个），把 _x_ 轴对准 **u**，旋转直到 _y_ 轴沿 **v**（或最接近 **v**）方向，那么 **w** 就会沿 _z_ 轴。{\*@eq:vec-cross}已经把这些都理清楚了。不过我确实需要右手坐标系，左手坐标系会把我脑子搞乱。

当向量平行时，**u × v** = 0，这意味着 **w** 是零向量 **0**。这也意味着，若 **u** 是你的视线方向，那么带向量 **v** 的物体正好处在你的准星正中央。但若 **u** 是火箭的速度、**v** 是相对你的向量，那就准备好重生吧。基本上，点积告诉你物体在前方还是后方（沿切线方向），而叉积给出的是偏离中心的距离（法线方向）。如果你想实现类似红龟壳之类的东西，这会非常有用（我指的是初代 SMK 红龟壳，而不是后来马里奥赛车里那种软绵绵的瞬间跟踪龟壳，呸！！）。叉积在物理中也大量出现，例如角动量（**L = r × p**）和磁感应。

以上是三维的情况，但叉积在二维中也很有用。一切都完全一样，只是你只需要 **w** 的 _z_ 分量。

### 范数（或长度） {#ssec-vec-norm}

我已经用过好几次了，却从没真正定义过向量的长度是什么。向量 **u** 的范数定义为它与自身点积的平方根，见{@eq:vec-norm}。古老的勾股定理不过是二维情况下的特例。

向量的长度（范数）是个很有用的东西。实际上，你常常是先有长度，再用正弦和余弦把向量分解成 _x_ 和 _y_ 分量。速度就是一个很好的例子。长度的另一用处是构造<dfn>单位向量</dfn>（长度为 1 的向量）。许多计算都会以某种方式用到长度，但如果长度是 1，你就不用再操心这个问题了。要构造单位向量，只需用它除以自身长度来定义：**û** = **u** / ‖**u**‖。

<table id="eq:vec-norm">
  <tr>
    <td class="eqnrcell">({!@eq:vec-norm})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mo stretchy="false">|</mo>
                  <mtext mathvariant="bold">u</mtext>
                  <mo stretchy="false">|</mo>
                  <mo>=</mo>
                  <msqrt>
                    <mo stretchy="false">(</mo>
                    <mtext mathvariant="bold">u</mtext>
                    <mo>&#x22C5;</mo>
                    <mtext mathvariant="bold">u</mtext>
                    <mo stretchy="false">)</mo>
                  </msqrt>
                  <mo>=</mo>
                  <mo stretchy="false">(</mo>
                  <munderover>
                    <mo data-mjx-texclass="OP">&#x2211;</mo>
                    <mrow data-mjx-texclass="ORD"></mrow>
                    <mrow data-mjx-texclass="ORD"></mrow>
                  </munderover>
                  <msubsup>
                    <mi>u</mi>
                    <mi>i</mi>
                    <mn>2</mn>
                  </msubsup>
                  <msup>
                    <mo stretchy="false">)</mo>
                    <mrow data-mjx-texclass="ORD">
                      <mfrac>
                        <mn>1</mn>
                        <mn>2</mn>
                      </mfrac>
                    </mrow>
                  </msup>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

### 向量的代数性质 {#ssec-vec-props}

下面列出向量的代数性质。大部分看起来显而易见，但你至少需要见过一次。直接抄自我的线性代数课本：令 **u、v、w** 为 M 维向量，_c_ 和 _d_ 为标量，则：

<div class="lblock">
  <table>
    <tr>
      <td><b>u + v = v + u</b></td>
      <td>交换律</td>
    </tr>
    <tr>
      <td><b>(u + v) + w = u + (v + w)</b></td>
      <td>结合律</td>
    </tr>
    <tr>
      <td><b>u + 0 = 0 + u = u</b></td>
    </tr>
    <tr>
      <td><b>u + (&minus;u) = &minus;u + u = 0</b></td>
      <td>其中 &minus;<b>u</b> 表示 (&minus;1)<b>u</b></td>
    </tr>
    <tr>
      <td>c·(<b>u + v</b>) = c·<b>u</b> + c·<b>v</b></td>
      <td>分配律</td>
    </tr>
    <tr>
      <td>(c + d)·<b>u</b> = c·<b>u</b> d·<b>u</b></td>
      <td>分配律</td>
    </tr>
    <tr>
      <td>c·(d·<b>u</b>) = (c·d)·<b>u</b></td>
      <td>结合律</td>
    </tr>
    <tr>
      <td>1·<b>u</b> = <b>u</b>
    </tr>
  </table>
</div>

然后是乘积的性质：

<div class="lblock">
  <table>
    <tr>
      <td width="256"><b>u · (v + w) = (u + v) · w</b></td>
      <td></td>
    </tr>
    <tr>
      <td><b>u ·</b> (c·<b>v</b>) = (c·<b>u</b>)<b> · v</b> = c·(<b>u · v</b>)
      <td></td>
    </tr>
    <tr>
      <td>&nbsp;</td>
      <td></td>
    </tr>
    <tr>
      <td><b>u &times; v</b> = &minus;(<b>u &times; v</b>)</td>
      <td>反交换性</td>
    </tr>
    <tr>
      <td><b>u</b> &times; (<b>v + w</b>) = <b>u &times; v + u &times; w</b></td>
      <td></td>
    </tr>
    <tr>
      <td>(<b>u + v</b>) &times; <b>w</b> = <b>u &times; w + v &times; w</b></td>
      <td></td>
    </tr>
    <tr>
      <td><b>u</b> &times; (c·<b>v</b>) = c·<b>u &times; v</b> = (c·<b>u</b>) &times; <b>v</b>
      <td></td>
    </tr>
    <tr>
      <td>&nbsp;</td>
      <td></td>
    </tr>
    <tr>
      <td><b>u ·</b> (<b>u &times; v</b>) = 0</td>
      <td></td>
    </tr>
    <tr>
      <td><b>u ·</b> (<b>v &times; w</b>) = (<b>u &times; v</b>) <b>· w</b></td>
      <td>三重标量积，给出由 <b>u, v, w</b> 定义的平行六面体的体积。</td>
    </tr>
    <tr>
      <td><b>u</b> &times; (<b>v &times; w</b>) = <b>u</b>(<b>v · w</b>) &minus; <b>w</b>(<b>u · v</b>)</td>
      <td>三重向量积</td>
    </tr>
  </table>
</div>

## 矩阵 {#sec-mat}

简而言之，矩阵就是一个二维的数字网格。它最初是作为求解线性方程组的简写而出现的。例如，使用变量 _x、y、z_ 的方程组：

<table id="eq:eqset">
  <tr>
    <td class="eqnrcell">({!@eq:eqset}a)</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mi>x</mi>
                </mtd>
                <mtd>
                  <mo>&#x2212;</mo>
                </mtd>
                <mtd>
                  <mn>2</mn>
                  <mi>y</mi>
                </mtd>
                <mtd>
                  <mo>+</mo>
                </mtd>
                <mtd>
                  <mi>z</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mn>0</mn>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd></mtd>
                <mtd></mtd>
                <mtd>
                  <mn>2</mn>
                  <mi>y</mi>
                </mtd>
                <mtd>
                  <mo>&#x2212;</mo>
                </mtd>
                <mtd>
                  <mn>8</mn>
                  <mi>z</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mn>8</mn>
                </mtd>
              </mtr>
              <mtr>
                <mtd></mtd>
                <mtd>
                  <mo>&#x2212;</mo>
                  <mn>4</mn>
                  <mi>x</mi>
                </mtd>
                <mtd>
                  <mo>+</mo>
                </mtd>
                <mtd>
                  <mn>5</mn>
                  <mi>y</mi>
                </mtd>
                <mtd>
                  <mo>+</mo>
                </mtd>
                <mtd>
                  <mn>9</mn>
                  <mi>z</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mo>&#x2212;</mo>
                  <mn>9</mn>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

可以用矩阵更简洁地写成：

<table>
  <tr>
    <td>
      <table>
        <tr>
          <td class="eqnrcell">({!@eq:eqset}b)</td>
          <td class="eqcell">
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <mstyle displaystyle="true" scriptlevel="0">
                <mrow data-mjx-texclass="ORD">
                  <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                    <mtr>
                      <mtd>
                        <mrow data-mjx-texclass="INNER">
                          <mo data-mjx-texclass="OPEN">[</mo>
                          <mtable columnspacing="1em" rowspacing="4pt">
                            <mtr>
                              <mtd>
                                <mn>1</mn>
                              </mtd>
                              <mtd>
                                <mo>&#x2212;</mo>
                                <mn>2</mn>
                              </mtd>
                              <mtd>
                                <mn>1</mn>
                              </mtd>
                            </mtr>
                            <mtr>
                              <mtd>
                                <mn>0</mn>
                              </mtd>
                              <mtd>
                                <mn>2</mn>
                              </mtd>
                              <mtd>
                                <mo>&#x2212;</mo>
                                <mn>8</mn>
                              </mtd>
                            </mtr>
                            <mtr>
                              <mtd>
                                <mo>&#x2212;</mo>
                                <mn>4</mn>
                              </mtd>
                              <mtd>
                                <mn>5</mn>
                              </mtd>
                              <mtd>
                                <mn>9</mn>
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
    </td>
    <td width=64 align="center">or</td>
    <td>
      <table>
        <tr>
          <td class="eqnrcell">({!@eq:eqset}c)</td>
          <td class="eqcell">
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <mstyle displaystyle="true" scriptlevel="0">
                <mrow data-mjx-texclass="ORD">
                  <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
                    <mtr>
                      <mtd>
                        <mrow data-mjx-texclass="INNER">
                          <mo data-mjx-texclass="OPEN">[</mo>
                          <mtable columnspacing="1em" rowspacing="4pt">
                            <mtr>
                              <mtd>
                                <mn>1</mn>
                              </mtd>
                              <mtd>
                                <mo>&#x2212;</mo>
                                <mn>2</mn>
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
                                <mn>0</mn>
                              </mtd>
                              <mtd>
                                <mn>2</mn>
                              </mtd>
                              <mtd>
                                <mo>&#x2212;</mo>
                                <mn>8</mn>
                              </mtd>
                              <mtd>
                                <mn>8</mn>
                              </mtd>
                            </mtr>
                            <mtr>
                              <mtd>
                                <mo>&#x2212;</mo>
                                <mn>4</mn>
                              </mtd>
                              <mtd>
                                <mn>5</mn>
                              </mtd>
                              <mtd>
                                <mn>9</mn>
                              </mtd>
                              <mtd>
                                <mo>&#x2212;</mo>
                                <mn>9</mn>
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
    </td>
  </tr>
</table>

{\*@eq:eqset}b 称为<dfn>系数矩阵</dfn>，其中只写下了变量的系数。<dfn>增广矩阵</dfn>（{@eq:eqset}c）还包含了方程组的等号右侧。注意变量本身完全不见踪影，这或多或少正是要点所在。数学家是世界上最懒的人，只要有简写可用，他们一定会用；如果没有，他们就自己造一个。

总之，矩阵可以分为<dfn>行</dfn>（水平方向）和<dfn>列</dfn>（垂直方向）。矩阵由其大小表示：一个 M×N 矩阵有 M 行和 N 列。注意行数在前，这与图像尺寸通常先给宽度不同。是的，我知道这很讨厌，但我对此也无能为力。{@eq:eqset}b 的系数矩阵是 3×3 矩阵，{@eq:eqset}c 的增广矩阵是 3×4。整个矩阵通常用粗体大写字母表示；矩阵的列其实就是向量（还记得吗，是 M×1 的列），会用单个下标表示列号；矩阵的<dfn>元素</dfn>则用带双下标的小写（斜体）字母表示。

<table id="eq:mat-def">
  <tr>
    <td class="eqnrcell">({!@eq:mat-def})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">A</mtext>
                  <mo>=</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">a</mtext>
                            <mn>1</mn>
                          </msub>
                        </mtd>
                        <mtd>
                          <mo>&#x22EF;</mo>
                        </mtd>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">a</mtext>
                            <mi>n</mi>
                          </msub>
                        </mtd>
                      </mtr>
                    </mtable>
                    <mo data-mjx-texclass="CLOSE">]</mo>
                  </mrow>
                  <mo>&#x2261;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">a</mtext>
                            <mrow data-mjx-texclass="ORD">
                              <mn>11</mn>
                            </mrow>
                          </msub>
                        </mtd>
                        <mtd>
                          <mo>&#x22EF;</mo>
                        </mtd>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">a</mtext>
                            <mrow data-mjx-texclass="ORD">
                              <mn>1</mn>
                              <mi>n</mi>
                            </mrow>
                          </msub>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mrow data-mjx-texclass="ORD">
                            <mo>&#x22EE;</mo>
                          </mrow>
                        </mtd>
                        <mtd></mtd>
                        <mtd>
                          <mrow data-mjx-texclass="ORD">
                            <mo>&#x22EE;</mo>
                          </mrow>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">a</mtext>
                            <mrow data-mjx-texclass="ORD">
                              <mi>m</mi>
                              <mn>1</mn>
                            </mrow>
                          </msub>
                        </mtd>
                        <mtd>
                          <mo>&#x22EF;</mo>
                        </mtd>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">a</mtext>
                            <mrow data-mjx-texclass="ORD">
                              <mi>m</mi>
                              <mi>n</mi>
                            </mrow>
                          </msub>
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

大多数计算机语言也有矩阵的概念，只是它们在元素的排列顺序上并不总是一致。例如 Visual Basic 和 C 的索引是基于行的，与{@eq:mat-def}一样。而 Fortran 是基于列的，所以下标需要反过来。得益于 C 的指针类型，你也可以把矩阵当作数组来访问。

```c {.proglist}
mat(i, j)     // VB 矩阵

mat[i][j]    // C 矩阵
mat[i+N*j]   // C 矩阵，数组形式

mat(j, i)    // Fortran 矩阵
```

让我们回到({@eq:eqset})一会儿。如果我们令 **x** = (_x, y, z_)、**b** = (0, 8, −9)，并用 **A** 表示系数矩阵，就可以把({@eq:eqset}a)改写为

<table>
  <tr>
    <td class="eqnrcell">({!@eq:eqset}d)</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <msub>
                    <mi>a</mi>
                    <mn>1</mn>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <mi>x</mi>
                  <mtext>&#xA0;</mtext>
                  <mo>+</mo>
                  <mtext>&#xA0;</mtext>
                  <msub>
                    <mi>a</mi>
                    <mn>2</mn>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <mi>y</mi>
                  <mtext>&#xA0;</mtext>
                  <mo>+</mo>
                  <mtext>&#xA0;</mtext>
                  <msub>
                    <mi>a</mi>
                    <mn>3</mn>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <mi>z</mi>
                  <mo>=</mo>
                  <mtext mathvariant="bold">b</mtext>
                  <mo>=</mo>
                  <mtext mathvariant="bold">A</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext mathvariant="bold">x</mtext>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

我在 **b** 左侧用了列向量记法，右侧用了完整的矩阵记法。最好记住这种方程形式，因为我们后面还会见到它。没错，右侧那里就是一次矩阵乘法。虽然我还没给出正式定义，但这应该能给你一些提示。

## 矩阵运算 {#sec-mat-ops}

### 转置 {#ssec-mat-transpose}

矩阵的转置就是沿对角线作镜像。它有时会很有用。转置的记法是在右上角加一个大写'T'，例如 **B** = **A**<sup>T</sup>。若 **A** 是 M×N 矩阵，则其转置 **B** 是 N×M，且元素满足 _b_<sub>ij</sub> = _a_<sub>ji</sub>。正如我所说，沿对角线作镜像。对角线本身当然保持不变。

### 矩阵加法 {#ssec-mat-add}

矩阵加法与向量加法很相似，只是变成了二维。如果 **A、B、C** 都是 M×N 矩阵，且 **C = A + B**，那么 **C** 的元素为 _c_<sub>ij</sub> = _a_<sub>ij</sub> + _b_<sub>ij</sub>。减法当然也一样。

### 矩阵乘法 {#ssec-mat-mul}

啊哈，现在事情开始有趣了。矩阵乘法有几条规则，使它相当棘手。在我们的乘法中，令 **C = A · B**。关键在于，第一个操作数（**A**）的列数_必须_等于第二个操作数（**B**）的行数。所以如果 **A** 是 _p×q_ 矩阵，**B** 就应该是 _q×r_ 矩阵。于是 **C** 的大小是 _p×r_。现在，**C** 的元素由下式给出：

<table id="eq:mat-mul-elem">
  <tr>
    <td class="eqnrcell">({!@eq:mat-mul-elem})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <msub>
                    <mi>c</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>i</mi>
                      <mi>j</mi>
                    </mrow>
                  </msub>
                  <mo>&#x2261;</mo>
                  <munderover>
                    <mo data-mjx-texclass="OP">&#x2211;</mo>
                    <mrow data-mjx-texclass="ORD">
                      <mi>k</mi>
                    </mrow>
                    <mrow data-mjx-texclass="ORD"></mrow>
                  </munderover>
                  <msub>
                    <mi>a</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>i</mi>
                      <mi>k</mi>
                    </mrow>
                  </msub>
                  <mo>&#x22C5;</mo>
                  <msub>
                    <mi>b</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mi>k</mi>
                      <mi>j</mi>
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
</table>

换句话说，你取 **A** 的第 _i_ 行、**B** 的第 _j_ 列，求它们的点积。{@eq:mat-mul-elem}中的 _k_ 是这个点积的求和下标。这也是为什么 **A** 的列与 **B** 的行必须大小相等的原因；否则两个向量就会多出一项对不上。另一种理解方式是：整个 **A** 构成了一个线性系统的系数矩阵，类似于{@eq:eqset}b 那样。**B** 的各列都是变量向量，经过该线性系统处理后，就得到 **C** 的各列：

<table id="eq:mat-mul">
  <tr>
    <td class="eqnrcell">({!@eq:mat-mul})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">C</mtext>
                  <mo>=</mo>
                  <mtext mathvariant="bold">A</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext mathvariant="bold">B</mtext>
                  <mo>&#x2261;</mo>
                  <mtext mathvariant="bold">A</mtext>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">b</mtext>
                            <mn>1</mn>
                          </msub>
                        </mtd>
                        <mtd>
                          <mo>&#x22EF;</mo>
                        </mtd>
                        <mtd>
                          <msub>
                            <mtext mathvariant="bold">b</mtext>
                            <mi>r</mi>
                          </msub>
                        </mtd>
                      </mtr>
                    </mtable>
                    <mo data-mjx-texclass="CLOSE">]</mo>
                  </mrow>
                  <mo>&#x2261;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mtext mathvariant="bold">A</mtext>
                          <mo>&#x22C5;</mo>
                          <msub>
                            <mtext mathvariant="bold">b</mtext>
                            <mn>1</mn>
                          </msub>
                        </mtd>
                        <mtd>
                          <mo>&#x22EF;</mo>
                        </mtd>
                        <mtd>
                          <mtext mathvariant="bold">A</mtext>
                          <mo>&#x22C5;</mo>
                          <msub>
                            <mtext mathvariant="bold">b</mtext>
                            <mi>r</mi>
                          </msub>
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

这种视角在讲到坐标变换时会显得很有价值。另外正如我说过，矩阵乘法就是把 **A** 的一行和 **B** 的一列做点积。由于向量本质上就是 M×1 的矩阵，普通的点积其实是矩阵乘法的一个特例。唯一要注意的是，你得取第一个向量的转置：

<table id="eq:vec-mul">
  <tr>
    <td class="eqnrcell">({!@eq:vec-mul})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>c</mi>
                  <mo>=</mo>
                  <mtext mathvariant="bold">u</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext mathvariant="bold">v</mtext>
                  <mo>=</mo>
                  <msup>
                    <mrow data-mjx-texclass="INNER">
                      <mo data-mjx-texclass="OPEN">[</mo>
                      <mtable columnspacing="1em" rowspacing="4pt">
                        <mtr>
                          <mtd>
                            <mtext mathvariant="bold">u</mtext>
                          </mtd>
                        </mtr>
                      </mtable>
                      <mo data-mjx-texclass="CLOSE">]</mo>
                    </mrow>
                    <mrow data-mjx-texclass="ORD">
                      <mi>T</mi>
                    </mrow>
                  </msup>
                  <mo>&#x22C5;</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mtext mathvariant="bold">v</mtext>
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

矩阵乘法还有很多其他用法，但我就补充下面两点。首先，矩阵乘法_不满足交换律_！也就是说 **A · B** ≠ **B · A**。你可能从行列要求中已经猜到了，但即便两边能相乘，它仍然不交换。我的[仿射精灵演示程序](affobj.html#sec-demo)就说明了这一点：先旋转再缩放，与先缩放再旋转，结果并不相同（而你想要的通常是后者）。只有在非常特殊的情况下，**A · B** 才等于 **B · A**。

另一点是矩阵乘法开销很大。你得为 **C** 的每个元素做一次点积（_q_ 次乘法），总共就是 _p·q·r_ 次乘法。这是一个 O(3) 复杂度的运算，属于最棘手的那种。好吧，对 2×2 矩阵来说不算什么，但当你处理 27×18 的矩阵时（就像我工作里那样），这就成问题了。好在有一些方法能减少计算量，不过这超出了本教程的范围。

### 行列式 {#ssec-mat-det}

<dfn>行列式</dfn>（determinant）是把<dfn>方阵</dfn>（大小为 N×N）的元素按某种方式组合后得到的标量。我翻遍了各处想找一个漂亮、清晰的定义，却收获甚微。它似乎有多种用途，但最常见的用途是作为一种简单的检验，判断一个方程组（或一组向量）是否线性无关，从而判断系数矩阵是否可逆。N×N 矩阵 **A** 的行列式的数学定义是一个递推式，形式如下。

<table id="eq:mat-det">
  <tr>
    <td class="eqnrcell">({!@eq:mat-det})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>det</mi>
                  <mo data-mjx-texclass="NONE">&#x2061;</mo>
                  <mtext mathvariant="bold">A</mtext>
                  <mo>=</mo>
                  <mo stretchy="false">|</mo>
                  <mtext mathvariant="bold">A</mtext>
                  <mo stretchy="false">|</mo>
                  <mo>=</mo>
                  <munderover>
                    <mo data-mjx-texclass="OP">&#x2211;</mo>
                    <mrow data-mjx-texclass="ORD">
                      <mi>j</mi>
                    </mrow>
                    <mrow data-mjx-texclass="ORD"></mrow>
                  </munderover>
                  <mo stretchy="false">(</mo>
                  <mo>&#x2212;</mo>
                  <mn>1</mn>
                  <msup>
                    <mo stretchy="false">)</mo>
                    <mrow data-mjx-texclass="ORD">
                      <mn>1</mn>
                      <mo>+</mo>
                      <mi>j</mi>
                    </mrow>
                  </msup>
                  <mtext>&#xA0;</mtext>
                  <msub>
                    <mi>a</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mn>1</mn>
                      <mi>j</mi>
                    </mrow>
                  </msub>
                  <mtext>&#xA0;</mtext>
                  <mi>det</mi>
                  <mo data-mjx-texclass="NONE">&#x2061;</mo>
                  <msub>
                    <mi>A</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mn>1</mn>
                      <mi>j</mi>
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
</table>

我可以更详细地解释，但其实意义不大。我就只给出 2×2 和 3×3 情形的公式。其实我前面已经给过了：就是在叉积那里。如果你有矩阵 **A** = \[**a**<sub>1</sub> **a**<sub>2</sub> **a**<sub>3</sub>\]，那么 ‖**A**‖ = **a**<sub>1</sub> · (**a**<sub>2</sub> × **a**<sub>3</sub>)。对于 2×2 矩阵 **B** = \[**b**<sub>1</sub> **b**<sub>2</sub>\]，结果是 _b_<sub>11</sub>·_b_<sub>22</sub> − _b_<sub>12</sub>·_b_<sub>21</sub>，其实也用到了叉积。这并非巧合。行列式用途之一就是判断矩阵是否可逆。基本上，若 ‖**A**‖ = 0，就不存在逆矩阵。而你还记得，叉积参与了向量之间面积的计算，只有当向量共线时面积才可能为 0。线性无关正是矩阵可逆的关键条件之一。另外，注意行列式的记法：det **A** = |**A**|。这有点像向量的范数，不是吗？既然相关的叉积与向量所张面积有关，那这样记也说得通。

### 矩阵求逆 {#ssec-mat-inv}

再回到{@eq:eqset}（又一次），我们有一个方程组，变量 **x** = (_x, y, z_)、矩阵 **A** 满足 **A · x** = **b**。这当然不错，但大多数时候未知的是 **x** 而不是 **b**。我们需要的不是从 **x** 到 **b** 的路径（即 **A**），而是它的逆。我们需要的是 **x** = **A**<sup>−1</sup> · **b**。**A**<sup>−1</sup> 是矩阵逆的记法。它的基本定义是 **A · A**<sup>−1</sup> = **I**，其中 **I** 是<dfn>单位矩阵</dfn>，其对角线上为 1，其余全为 0。求逆有多种方法。当然可以试错（想都别想！），也可以用通常解线性方程组的方法：行化简。既然我还没讲过这个，我就只给出一个公式，即 2×2 的情形：

<table id="eq:2d-inv">
  <tr>
    <td class="eqnrcell">({!@eq:2d-inv})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mtext mathvariant="bold">A</mtext>
                  <mo>=</mo>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mi>a</mi>
                        </mtd>
                        <mtd>
                          <mi>b</mi>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mi>c</mi>
                        </mtd>
                        <mtd>
                          <mi>d</mi>
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
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <msup>
                    <mtext mathvariant="bold">A</mtext>
                    <mrow data-mjx-texclass="ORD">
                      <mo>&#x2212;</mo>
                      <mn>1</mn>
                    </mrow>
                  </msup>
                  <mo>&#x2261;</mo>
                  <mfrac>
                    <mn>1</mn>
                    <mrow>
                      <mi>a</mi>
                      <mi>d</mi>
                      <mo>&#x2212;</mo>
                      <mi>b</mi>
                      <mi>c</mi>
                    </mrow>
                  </mfrac>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">[</mo>
                    <mtable columnspacing="1em" rowspacing="4pt">
                      <mtr>
                        <mtd>
                          <mi>d</mi>
                        </mtd>
                        <mtd>
                          <mo>&#x2212;</mo>
                          <mi>b</mi>
                        </mtd>
                      </mtr>
                      <mtr>
                        <mtd>
                          <mo>&#x2212;</mo>
                          <mi>c</mi>
                        </mtd>
                        <mtd>
                          <mi>a</mi>
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

这是逆矩阵最简单的情况。而且，分母确实就是行列式。你可以想象分母为 0 时会发生什么。关于矩阵求逆，你还需要知道几点：只有方阵才有可能可逆；你可以用行列式来判断是否真的可逆。此外，逆的逆就是原矩阵本身。当然还有更多（噢天哪确实有更多），但眼下这些就够了。

### 矩阵的代数性质 {#ssec-mat-props}

**A** 和 **B** 是 M×N 矩阵；**C** 是 N×P 矩阵；**D** 和 **E** 是 N×N 矩阵。**e**<sub>i</sub> 是 **E** 的列向量。_c_ 是标量。

<div class="lblock">
<table cellpadding=2 cellspacing=0>
  <tr>
    <td><b>A + B</b> = <b>B + A</b></td>
  </tr>
  <tr>
    <td>c·(<b>A + B</b>) = c<b>B</b> + c<b>A</b></td>
  </tr>
  <tr>
    <td><b>A·I</b> = <b>I·A</b> = <b>A</b></td>
  </tr>
  <tr>
    <td>
      <b>A·C</b> = <b>C·A</b> <i>仅当</i> M=P 时成立，而且即便如此也只在非常特殊的条件下才成立
    </td>
  </tr>
  <tr>
    <td>
      若 <b>E·F</b> = <b>I</b>，则 <b>E</b><sup>&minus;1</sup> = <b>F</b> 且 <b>F</b><sup>&minus;1</sup> = <b>E</b>
    </td>
  </tr>
  <tr>
    <td>(<b>A</b><sup>T</sup>)<sup>T</sup> = <b>A</b></td>
  </tr>
  <tr>
    <td>
      (<b>A·C</b>)<sup>T</sup> = <b>C</b><sup>T</sup> · <b>A</b><sup>T</sup>
    </td>
  </tr>
  <tr>
    <td>
      (<b>A·C</b>)<sup>&minus;1</sup> = <b>C</b><sup>&minus;1</sup> · <b>A</b><sup>&minus;1</sup>
    </td>
  </tr>
  <tr>
    <td>
      若 <b>a</b><sub>i</sub> · <b>a</b><sub>j</sub> = &delta;<sub>ij</sub>，则 <b>A</b><sup>&minus;1</sup> = <b>A</b><sup>T</sup>（换言之，若各向量为单位向量且彼此垂直，则逆等于转置。）
    </td>
  </tr>
</table>
</div>

## 空间、基与坐标变换 {#sec-space}

所有可能向量的集合称为<dfn>向量空间</dfn>。维数由向量所含数字的个数决定（还是反过来？）。二维空间里的向量有 2 个元素，三维有 3 个，依此类推。通常，向量的元素用来告诉你空间中某个位置在哪里，但含义不止于此。要完整定义一个位置，你需要：

- 一组基
- 一个原点
- 坐标

你熟悉的向量只涵盖了坐标部分，但没有另外两项，坐标毫无意义，它们只是数字而已。像 (2, 1) 这样一组坐标，和一个"1"的速率一样说明不了什么。它们需要一个参照系才有意义。对物理量来说，参照系就是单位（如 km/h、miles/h 或 m/s，看出单位对速率影响多大了吗）；对空间来说，参照系就是一组基和一个原点。

### 坐标系 {#ssec-space-sys}

<div class="lblock">
  <table id="fig:img-sys">
    <tr>
      <td>
        <div class="cpt" style="width:192px">
          <img src="img/math/crd_cart.png" alt="笛卡尔坐标系。">
          <br>
          <b>{*@fig:img-sys}a</b>: 标准坐标系 S。点 <i>P</i> 的坐标为 <nobr>(3, 2)</nobr>。
        </div>
      </td>
      <td>
        <div class="cpt" style="width:192px">
          <img src="img/math/crd_shear.png" alt="剪切坐标系">
          <br>
          <b>{*@fig:img-sys}b</b>: 一个被剪切的坐标系 S'。点 <i>P</i> 的坐标为 <nobr>(1, 2)</nobr>。
        </div>
      </td>
    </tr>
  </table>
</div>

{\*@fig:img-sys}a 展示了你大概很熟悉的二维笛卡尔坐标系。有一条水平的 x 轴（**i** = (1, 0)）和垂直的 y 轴（**j** = (0, 1)）。我在其中放了一个点 _P_。沿着网格线看，你会得到 x=3、y=2，所以 _P_ = (3, 2)，对吧？嗯，也对，也不对。在我看来，多半是不对。

关键在于，空间中的一个点本身并没有真正的"坐标"，它就在那里。坐标取决于你的参照系，而参照系本质上是任意的。为了说明这点，请看{@fig:img-sys}b：这张图里我有一个坐标系 S'，它的 x 轴仍然是水平的（**u** = (1, 0)），但 y 轴（**v** = (1, 1)）被剪切了 45°。在这个坐标系中，点 _P_ 的坐标是 (1, 2)，而不是 (3, 2)。如果你把一个系统的坐标直接套用到另一个系统，坏事就会发生。

现在浮现出两个问题：为什么会有人使用不同的坐标系？又如何在两个系统之间转换？本文余下的部分我来回答后者。至于前者，虽然笛卡尔坐标系非常有用，但很多时候若死守它，现实（或虚拟）世界中的计算会复杂得多。比如，描述行星轨道或涉及磁性的问题时，用球坐标或柱坐标会容易得多。再比如，在纹理映射中，纹理上的纹素需要贴到表面上，而这些表面在几乎所有情况下都不与你的世界坐标对齐。[仿射变换](affine.html)就是绝佳的例子。所以，使用非笛卡尔坐标确实非常有用。

### 构造坐标基 {#ssec-space-build}

说除了笛卡尔坐标系还有其他坐标系，这很好，但究竟怎么用呢？其实很简单。想想你在笛卡尔坐标系里用坐标时到底在做什么。再看一次{@fig:img-sys}a。假设你得到一组坐标 (x, y) = (3, 2)。要找到它的位置，你沿 x 轴移动 3、沿 y 轴移动 2，就得到了点 _P_。现在，在系统 S'（{@fig:img-sys}b）中，我们有 (x', y') = (1, 2)，但 S 中的做法在这里行不通，因为我们没有 y 轴。不过，我们确实有向量 **u** 和 **v**。如果你沿 **u** 移动 1、沿 **v** 移动 2，就又回到了点 _P_。再回到系统 S，x 轴和 y 轴其实分别是向量 _i_ 和 _j_，所以我们其实在两个系统里用的是同一套做法。基本上，我们做的是：

<table id="eq:coords">
  <tr>
    <td class="eqnrcell">({!@eq:coords}a)</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>P</mi>
                  <mo>=</mo>
                  <mtext mathvariant="bold">i</mtext>
                  <mo>&#x22C5;</mo>
                  <mi>x</mi>
                  <mtext>&#xA0;</mtext>
                  <mo>+</mo>
                  <mtext>&#xA0;</mtext>
                  <mtext mathvariant="bold">j</mtext>
                  <mo>&#x22C5;</mo>
                  <mi>y</mi>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  <tr>
    <td class="eqnrcell">({!@eq:coords}b)</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>P</mi>
                  <mo>=</mo>
                  <mtext mathvariant="bold">u</mtext>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mi>x</mi>
                    <mo data-mjx-alternate="1">&#x2032;</mo>
                  </msup>
                  <mtext>&#xA0;</mtext>
                  <mo>+</mo>
                  <mtext>&#xA0;</mtext>
                  <mtext mathvariant="bold">v</mtext>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mi>y</mi>
                    <mo data-mjx-alternate="1">&#x2032;</mo>
                  </msup>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

如果你留心了，应该能认出这些方程的结构。没错，我们之前在{@eq:eqset}d 里见过。如果我们把向量和坐标改写为矩阵和向量，就得到

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mtext mathvariant="bold">M</mtext>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">[</mo>
              <mtable columnspacing="1em" rowspacing="4pt">
                <mtr>
                  <mtd>
                    <mtext mathvariant="bold">i</mtext>
                  </mtd>
                  <mtd>
                    <mtext mathvariant="bold">j</mtext>
                  </mtd>
                </mtr>
              </mtable>
              <mo data-mjx-texclass="CLOSE">]</mo>
            </mrow>
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
                </mtr>
                <mtr>
                  <mtd>
                    <mn>0</mn>
                  </mtd>
                  <mtd>
                    <mn>1</mn>
                  </mtd>
                </mtr>
              </mtable>
              <mo data-mjx-texclass="CLOSE">]</mo>
            </mrow>
            <mo>,</mo>
            <mtext>&#xA0;</mtext>
            <mtext>&#xA0;</mtext>
            <mtext mathvariant="bold">x</mtext>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">[</mo>
              <mtable columnspacing="1em" rowspacing="4pt">
                <mtr>
                  <mtd>
                    <mi>x</mi>
                  </mtd>
                </mtr>
                <mtr>
                  <mtd>
                    <mi>y</mi>
                  </mtd>
                </mtr>
              </mtable>
              <mo data-mjx-texclass="CLOSE">]</mo>
            </mrow>
            <mo>;</mo>
            <mtext>&#xA0;</mtext>
            <mtext>&#xA0;</mtext>
            <msup>
              <mtext mathvariant="bold">M</mtext>
              <mo data-mjx-alternate="1">&#x2032;</mo>
            </msup>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">[</mo>
              <mtable columnspacing="1em" rowspacing="4pt">
                <mtr>
                  <mtd>
                    <mtext mathvariant="bold">u</mtext>
                  </mtd>
                  <mtd>
                    <mtext mathvariant="bold">v</mtext>
                  </mtd>
                </mtr>
              </mtable>
              <mo data-mjx-texclass="CLOSE">]</mo>
            </mrow>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">[</mo>
              <mtable columnspacing="1em" rowspacing="4pt">
                <mtr>
                  <mtd>
                    <mn>1</mn>
                  </mtd>
                  <mtd>
                    <mn>1</mn>
                  </mtd>
                </mtr>
                <mtr>
                  <mtd>
                    <mn>0</mn>
                  </mtd>
                  <mtd>
                    <mn>1</mn>
                  </mtd>
                </mtr>
              </mtable>
              <mo data-mjx-texclass="CLOSE">]</mo>
            </mrow>
            <mo>,</mo>
            <mtext>&#xA0;</mtext>
            <mtext>&#xA0;</mtext>
            <msup>
              <mtext mathvariant="bold">x</mtext>
              <mo data-mjx-alternate="1">&#x2032;</mo>
            </msup>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">[</mo>
              <mtable columnspacing="1em" rowspacing="4pt">
                <mtr>
                  <mtd>
                    <msup>
                      <mi>x</mi>
                      <mo data-mjx-alternate="1">&#x2032;</mo>
                    </msup>
                  </mtd>
                </mtr>
                <mtr>
                  <mtd>
                    <msup>
                      <mi>y</mi>
                      <mo data-mjx-alternate="1">&#x2032;</mo>
                    </msup>
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
<br>
<table>
  <tr>
    <td class="eqnrcell">({!@eq:coords}c)</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>P</mi>
                  <mo>=</mo>
                  <mtext mathvariant="bold">M</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext mathvariant="bold">x</mtext>
                  <mo>=</mo>
                  <msup>
                    <mtext mathvariant="bold">M</mtext>
                    <mo data-mjx-alternate="1">&#x2032;</mo>
                  </msup>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mtext mathvariant="bold">x</mtext>
                    <mo data-mjx-alternate="1">&#x2032;</mo>
                  </msup>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

向量 **x** 和 **x'** 包含坐标，一如既往。新意在于，我们现在用矩阵 **M** 和 **M'** 的形式来定义坐标系。构成这些矩阵的向量就是该坐标系的<dfn>基向量</dfn>。当然，由于系统 S 的基向量是标准单位向量，它们组成的矩阵就是单位矩阵 **M == I**，可以放心地省去（通常也确实省去了），但别忘了它隐藏在幕后。其实还有一样东西通常会隐式地加进方程，那就是原点 _O_。标准原点是零向量，但未必一定要是。

{\*@eq:pt-def} 是定义一个点的完整方程。_O_ 是坐标系的原点，**M** 定义基向量，**x** 是从原点出发、在该基下的一组坐标。注意这些量完全是任意的；前面讨论中的 **M** 和 **x** 只是其中的例子。

<table id="eq:pt-def">
  <tr>
    <td class="eqnrcell">({!@eq:pt-def})</td>
    <td class="eqcell">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mstyle displaystyle="true" scriptlevel="0">
          <mrow data-mjx-texclass="ORD">
            <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
              <mtr>
                <mtd>
                  <mi>P</mi>
                  <mo>=</mo>
                  <mi>O</mi>
                  <mo>+</mo>
                  <mtext mathvariant="bold">M</mtext>
                  <mo>&#x22C5;</mo>
                  <mtext mathvariant="bold">x</mtext>
                </mtd>
              </mtr>
            </mtable>
          </mrow>
        </mstyle>
      </math>
    </td>
  </tr>
</table>

### 最后说明 {#ssec-space-notes}

最好用{@eq:pt-def}（即一个原点、一个基矩阵和一个坐标向量）的方式来理解点，而不是仅仅把它看作一组坐标。你会发现这项技术能应用到极多问题上，而用通用的描述能让这些问题更容易求解。例如，精灵和背景的旋转与缩放，不过是坐标系的变化而已。pa-pd 里没有任何魔法，它们只是定义屏幕→纹理空间变换的矩阵。

在处理坐标系变换时，务必搞清楚谁对谁做了什么。在两个系统之间变换时，你很容易写出与你本意恰好相反的逆变换。例如，给定上一段的 S 和 S'，我们看到 **x = M · x'**，也就是说 **M** 是从 S' 变换到 S。但 **M** 的基向量位于系统 S 内部，所以你可能会误以为它是从 S 变换到 S'。其实它不是。GBA 使用的 **P** 矩阵也有类似情况。该矩阵的基向量位于纹理空间内（见[仿射](affine.html)页的图 5），这意味着它所做的变换是从屏幕空间到纹理空间，而不是反过来。

基矩阵不必是方阵；你可以用任意 M×N 矩阵。这对应于从 N 维到 M 维的转换。例如，若 M=3、N=2（即两个三维向量），你就得到三维世界中的一个平面。若 N>M，你得到的则是一个投影。
