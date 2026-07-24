# B. 定点数与查找表（LUT）

<!-- toc -->

## 什么是定点数 {#sec-intro}

粗略地说，数字有两种：整数和浮点数。对大多数严肃的数学运算，整数都不够用，因为按定义它们不允许有小数。所以对 3D 游戏你会用浮点运算。在专门浮点硬件出现之前的旧日子里，那东西非常慢！至少比整数运算慢。幸运的是，有一种用整数假冒带小数点数字的方法。这就是 <dfn>定点数运算（fixed-point math）</dfn>。

### 一般定点数 {#ssec-fix-gen}

举个例。假设你钱包里有 \$10.78（十美元七十八美分）。如果你想把这笔金额写成整数就有问题，因为你要么丢掉小数部分（\$10），要么把它四舍五入成 \$11。不过，你也可以不按美元而是按 *分* 来写。那样你会写 1078，这是个整数，问题解决了。

定点数运算就是这么工作的。你不是数“单位”，而是数 *分数*。在前面的例子里，你以分、也就是百分之一来计数。定点数有一个整数部分（“10”）和一个小数部分（“78”）。既然小数部分用了 2 位数字，我们称这种为 <dfn>x.2</dfn> 格式的定点数。

注意，PC 自 1990 年代中期起就有了浮点单元（FPU）。这使得浮点运算和整数运算一样快（有时甚至更快），所以除了光栅化之外，用定点数运算并不真的值得费劲，因为从 `float` 到 `int` 的转换仍然很慢。然而，GBA 不擅长浮点，所以它全程都是定点运算。

### GBA 中的定点数用法 {#ssec-fix-gba}

因为计算机使用[二进制系统](numbers.html#ssec-num-basen)，用十进制作为定点数的基础是愚蠢的。幸运的是，你可以用任何进制做定点数运算，包括二进制。基本格式是 *i*.*f*，其中 *i* 是整数位数，*f* 是小数位数。通常，只有小数位数重要，所以你也会看到只写“.*f*”。

GBA 在好些地方用定点数运算。比如[仿射参数](affine.html)，全是 .8 定点数（简称“<dfn>fixeds</dfn>”）。实际上，这意味着你以 1/2<sup>8</sup> = 1/256 为单位计数，精度为 0.004。所以当你往像 REG_BG2PA 这样的寄存器写 256 时，它实际被解释为 256/256=1.00。REG_BG2PA=512 即 2.00，640 即 2.50，等等。当然，这在十进制里有点难看出来，但拿计算器你会确认这是真的。为此，通常更方便的是用十六进制写它们：256=0x100→1.00，512=0x200→2.00，640=0x280→2.50（记住 8 是 16/2，即一半）。

```c
// .8 fixed point examples : counting in fractions of 256

int a= 256;         // 256/256 = 1.00
int a= 1 << 8;      // Ditto
int a= 0x100;       // Ditto

int b= 0x200;       // 0x200/256 = 512/256 = 2.00
int c= 0x080;       // 0x080/256 = 128/256 = 0.50
int d= 0x280;       // 0x280/256 = 640/256 = 2.50
```

仿射寄存器不是唯一用定点数的地方，尽管那里最易辨认。[混合权重](gfx.html#sec-blend)本质上也是定点数，只是它们是 1.4 定点数而非 .8 定点数。这实际上是个要点：你给定点数设定的位置是任意的，你甚至可以在过程中切换位置。现在，数字本身不会告诉你小数点在哪，所以要么自己记住，要么——更好——在注释里写下来。相信我，你绝不想在冗长算法的中间去猜定点数的位置。

:::tip 注释你的定点数位置

当你使用定点数变量时，试着标明它们的定点数格式，特别是在你需要它们做较长计算、点的位置可能随所用操作而移动时。

:::

### 定点数与符号 {#ssec-fix-sign}

定点数本该是浮点数的穷人替代品，而浮点数是包含负数的。这意味着它们本该是 *有符号* 的。或者至少通常是。例如，仿射寄存器用有符号的 8.8 定点数，但混合权重是无符号的 1.4 定点数。你可能觉得这几乎无关紧要，但[符号](numbers.html#bits-int-sign)如果不小心真的能把事情搞砸。假设你用定点数表示位置和速度。即便你的位置总为正，速度也不会，所以有符号数更合适。此外，如果你的定点数是半字，比如 8.8 定点数，有符号的“−1”会是 `0xFFFFFFFF`，即一个恰当的“−1”，而无符号的“−1”是 `0x0000FFFF`，那其实是个正数。你不会是第一个在这上面栽跟头的人，也不会是最后一个。所以有符号定点数，拜托。

另一点要注意的是有符号定点数常被标明的方式。你可能会看到“1.*n*.*f*”这样的形式。这是为了表示一个符号位、*n* 个整数位和 *f* 个小数位。严格来说，这是 **错的**。定点数只是普通整数，只是被解释为分数。这意味着它们遵循[补码（two's complement）](numbers.html#bits-int-neg)，并且虽然置位的顶位确实表示负数，但它并不是 *那个* 符号位。正如我所说，“−1”在补码里是 `0xFFFFFFFF`，而不是符号-数值（sign and magnitude）里的 `0x80000001`。你可能不觉得这个区别有多大意义、觉得显然它仍是补码，但考虑到浮点格式 *确实* 有独立的符号位，我说它值得记住。

:::warning 有符号定点数格式记法

有符号定点数格式有时被标为“1.*n*.*f*”。由此你可能会以为它们像浮点格式那样有个独立的符号位，但这是 **不正确的**。它们仍是普通整数，用补码表示负数。

:::

## 定点数运算 {#sec-fmath}

知道定点数是什么是一回事，你还得以某种方式使用它们。我们关心三件事。

-   在普通整数或浮点与定点数之间转换。
-   算术运算。
-   溢出。

这些项目没有哪个难懂，但每个都有其别扭之处。事实上，溢出 *只是* 一个问题，算不上真正的项目。本节聚焦 24.8 有符号定点数，我会用一个 typedef 为 int 的“FIXED”类型。虽然只用这种定点格式，但这里涉及的主题也能轻松应用到其他格式。

### 定点数的相互转换 {#ssec-fmath-conv}

我不太确定“转换”在这里是不是正确的词。定点数和普通数的唯一区别是一个缩放因子 *M*。从 FIXED 到 int 或 float 所需的一切，就是通过乘或除来计入那个缩放。是的，真的就这么简单。因为我们用的缩放是 2 的幂，整数↔FIXED 转换甚至可以用移位完成。你可以自己在代码里加移位，但编译器足够聪明，会把 2 的幂的乘除自己转成移位。

```c
typedef s32 FIXED;         //! 32bit FIXED in 24.8 format

// For other fixed formats, change FIX_SHIFT and the rest goes with it.

//! Convert an integer to fixed-point
INLINE FIXED int2fx(int d)
{   return d<<FIX_SHIFT;    }

//! Convert a float to fixed-point
INLINE FIXED float2fx(float f)
{   return (FIXED)(f*FIX_SCALEF);   }


//! Convert a fixed point value to an unsigned integer.
INLINE u32 fx2uint(FIXED fx)    
{   return fx>>FIX_SHIFT;   }

//! Get the unsigned fractional part of a fixed point value (orly?).
INLINE u32 fx2ufrac(FIXED fx)
{   return fx&FIX_MASK; }

//! Convert a FIXED point value to an signed integer.
INLINE int fx2int(FIXED fx)
{   return fx/FIX_SCALE;    }

//! Convert a fixed point value to floating point.
INLINE float fx2float(FIXED fx)
{   return fx/FIX_SCALEF;   }
```

#### 舍入与负数不一致问题

转换几乎和上面描述的一样简单。两个可能出问题的地方是舍入不一致和负小数。注意我说的是它们 *可能* 有问题；取决于你心里想什么。我不打算在这里解释所有来龙去脉，因为它们通常没那么大问题，但你需要意识到它们。

如果你不是编程新手，你无疑会意识到从 float 到 int 的舍入问题：简单的强制类型转换会截断一个数，而不是真正四舍五入。例如，`(int)1.7` 给出结果 1 而非 2。前面的宏有同样的问题（如果你能这么叫的话）。浮点到整数的四舍五入是在四舍五入前给浮点数加半个（0.5），我们也可以把它用到定点数转换上。当然，这里的半个值取决于定点数的位数。例如，.8 定点数，½ 是 0x80=128（256/2），对 .16 定点数是 0x8000=32768。在向下移位前加上它就能正确四舍五入。四舍五入其实有多种方式，你可以读 ["An Introduction to Fixed Point Math" by Brian Hook](https://web.archive.org/web/20060204155500/http://www.bookofhook.com/Article/GameDevelopment/AnIntroductiontoFixedPoin.html)。

然后是负数的问题。坦白说，负数的除法总是个麻烦。基本问题是它们总是向零取整：+3/4 和 −3/4 都给出 0。某些方面这说得通，但某方面又说不通：它在零附近打断了输出的序列。这本身就烦人，但更糟的是右移位 *不* 遵循这种行为；它总是移向负无穷。换句话说，对负整数的除法，除法和右移运算符并 *不* 相同。选哪种方法是你自己的设计考量。就我个人而言，我倾向于用移位，因为它给出更一致的结果。

<div class="cblock">
<table id="tbl:neg-div" class="table-data">
<caption align="bottom">
  <b>*@tbl:neg-div</b>：
  零附近的除法与右移。
</caption>
<col span=19 width=20>
<tbody align="center">
<tr>
  <th><i>x</i> 
  <td> -8<td> -7<td> -6<td> -5<td> -4<td> -3<td> -2<td> -1<td>  0
  <td>  1<td>  2<td>  3<td>  4<td>  5<td>  6<td>  7<td>  8<td>  9
<tr>
  <th><i>x</i>/4 
  <td> -2<td> <b>-1</b><td> <b>-1</b><td> <b>-1</b><td> -1
  <td>  <b>0</b><td>  <b>0</b><td>  <b>0</b><td>  0
  <td>  0<td>  0<td>  0<td>  1<td>  1<td>  1<td>  1<td>  2<td>  2

<tr>
  <th><i>x</i>&gt;&gt;2 
  <td> -2<td> <b>-2</b><td> <b>-2</b><td> <b>-2</b><td> -1
  <td> <b>-1</b><td> <b>-1</b><td> <b>-1</b><td>  0
  <td>  0<td>  0<td>  0<td>  1<td>  1<td>  1<td>  1<td>  2<td>  2
</tbody>
</table>
</div>

负数的除法麻烦在你想处理小数部分时更糟。用 AND 掩码实际上会摧毁一个数的符号。例如，8.8 的 −2¼ 是 −0x0240 = 0xFDC0。用 0xFF 掩码会得到 0xC0 = ¾，一个正数，而且还是错的分数。另一方面 0xFDC0\>\>8 是 −3，无论好坏，而 −3 + ¾ 确实是 −2¼，所以从那种意义上说它确实成立。它是否对你成立，要你自己决定。如果你想以某种方式显示定点数（比如本例中的 -2.40），你得比仅仅移位和掩码更有创意。现在，我连碰都不碰那个。

:::warning 转换负的定点数

从负的定点数到整数的转换尤其混乱，且因为存在多个同样有效的解决方案而更复杂。选哪个由你决定。如果可以，避免这种可能；定点到整数的转换通常保留给算术的最后阶段，如果你能以某种方式确保那些数是正的，就这么做。

:::

### 算术运算 {#ssec-fmath-ops}

定点数仍是整数，所以它们共享其算术运算。不过，有时需要小心以保持定点处于正确位置。过程和十进制算术一样。例如，0.01+0.02 = 0.03；你通常会为这个和去掉小数点，留下 1 和 2，相加得 3，再把小数点放回去。这本质上也是定点数的工作方式。但当加 0.1 和 0.02 时，定点小数不是 1 和 2，而是 **10** 和 2。这里的关键是，对加法（和减法），小数点应在同一位置。

乘法和除法也发生类似的事。以乘法 0.2×0.3 为例。2×3 等于 6，然后放回小数点得到 0.6，对吧？嗯，如果你 preschool（学前）作业做好了，会知道结果其实应该是 0.06。不仅小数相乘，*缩放* 也相乘。

这两点都适用于定点数运算。如果你始终用同一个定点数，加法和减法不会有问题。对乘法和除法，你还要计入额外的缩放因子。定点-定点乘法之后需要除以缩放，而定点-定点除法在除法 *之前* 需要乘一个缩放。在两种情况下，缩放校正位置的原因都是为了保持最高精度。方程 1 和 2 以更数学化的形式展示了这点。定点数总是由常数乘以定点缩放 *M* 给出。加法和减法保持缩放，乘法和除法不保持，所以你要分别去掉或加上一个缩放因子。

<!--
\begin{matrix}
fa & = & a \cdot M \\
fb & = & b \cdot M
\end{matrix}
-->
<table id="eq:fix-add">
<tr>
  <td class="eqnrcell">(!@eq:fix-add)</td>
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
                  <mi>a</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>a</mi>
                  <mo>&#x22C5;</mo>
                  <mi>M</mi>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>f</mi>
                  <mi>b</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>b</mi>
                  <mo>&#x22C5;</mo>
                  <mi>M</mi>
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

<!--
\begin{matrix}
fc & = & fa+fb & = & (a+b) \cdot M \\
fd & = & fa-fb & = & (a-b) \cdot M \\
fe & = & fa \cdot fb & = & (a \cdot b) \cdot M^2 \\
ff & = & fa / fb & = & a/b
\end{matrix}
-->
<table id="eq:fix-mul">
<tr>
  <td class="eqnrcell">(!@eq:fix-mul)</td>
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
                  <mi>c</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>f</mi>
                  <mi>a</mi>
                  <mo>+</mo>
                  <mi>f</mi>
                  <mi>b</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mo stretchy="false">(</mo>
                  <mi>a</mi>
                  <mo>+</mo>
                  <mi>b</mi>
                  <mo stretchy="false">)</mo>
                  <mo>&#x22C5;</mo>
                  <mi>M</mi>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>f</mi>
                  <mi>d</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>f</mi>
                  <mi>a</mi>
                  <mo>&#x2212;</mo>
                  <mi>f</mi>
                  <mi>b</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mo stretchy="false">(</mo>
                  <mi>a</mi>
                  <mo>&#x2212;</mo>
                  <mi>b</mi>
                  <mo stretchy="false">)</mo>
                  <mo>&#x22C5;</mo>
                  <mi>M</mi>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>f</mi>
                  <mi>e</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>f</mi>
                  <mi>a</mi>
                  <mo>&#x22C5;</mo>
                  <mi>f</mi>
                  <mi>b</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mo stretchy="false">(</mo>
                  <mi>a</mi>
                  <mo>&#x22C5;</mo>
                  <mi>b</mi>
                  <mo stretchy="false">)</mo>
                  <mo>&#x22C5;</mo>
                  <msup>
                    <mi>M</mi>
                    <mn>2</mn>
                  </msup>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>f</mi>
                  <mi>f</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>f</mi>
                  <mi>a</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
                  <mi>f</mi>
                  <mi>b</mi>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>a</mi>
                  <mrow data-mjx-texclass="ORD">
                    <mo>/</mo>
                  </mrow>
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
</tr>
</table>

```c
//! Add two fixed point values
INLINE FIXED fxadd(FIXED fa, FIXED fb)
{   return fa + fb;         }

//! Subtract two fixed point values
INLINE FIXED fxsub(FIXED fa, FIXED fb)
{   return fa - fb;         }

//! Multiply two fixed point values
INLINE FIXED fxmul(FIXED fa, FIXED fb)
{   return (fa*fb)>>FIX_SHIFT;              }

//! Divide two fixed point values.
INLINE FIXED fxdiv(FIXED fa, FIXED fb)
{   return ((fa)*FIX_SCALE)/(fb);           }
```

### 上溢与下溢 {#ssec-fmath-flow}

这其实是乘法和除法的缩放问题的一个子集。溢出是指操作结果高于你用来存储它的位数。这对任何整数乘法都是个潜在问题，但在定点数运算里它发生得更频繁，因为不仅定点数被向上缩放，定点数相乘还会把它放大 *两倍*。一次 .8 定点乘法其“一”在 2<sup>16</sup>，对半字来说已经超出范围。

为应对额外缩放的一种方法是，不在乘法之后而在之前校正；虽然过程中你会损失一些精度。一个不错的折衷是在乘法前把两个操作数都右移半个完整移位量。

定点除法有类似的问题，叫下溢。作为简单例子，考虑整数除法 *a*/*b* 在 *b*\>*a* 时会发生什么。没错：结果会是零，即便你想要的是个分数。为补救这种行为，先把分子按 *M* 向上缩放（这可能导致也可能不导致溢出问题 <kbd>:P</kbd>）。

如你所见，定点数运算的原理并不那么困难或神秘。但你必须保持头脑清醒：一次漏掉或放错位置的移位，整个东西就崩塌。如果你在搞新算法，考虑先用浮点做（最好在 PC 上），只在确认算法本身有效后才转到定点数。

## 伪造除法（可选） {#sec-rmdiv}

:::warning 数学密集且可选

本节关于一个有时有用的优化技术。它不仅介绍了该技术，还推导了它的用途和安全限度。因此，途中会有些恼人的数学。你很可能在不详细了解本节内容的情况下也安然无恙，但当你需要摆脱一些慢速除法时它能帮上忙。

:::

你可能听过这句话“除以常数就是乘它的倒数”。这个技术可以用来去掉除法，代之以快得多的乘法。例如 *x*/3 = *x*·(1/3) = *x*·0.333333。乍一看，这似乎帮不上忙：1/*y* 的整数形式按定义总是零；替代方案是浮点，那也不怎么妙，而且你 *仍然* 需要一次除法才能到那一步！这些都是真的，但重要的是这些问题可以避开。整数/浮点问题可以通过用定点数代替来解决。至于除法，记住我们谈论的是除以 *常数*，而常数的算术是在编译时而非运行时做的。所以问题解决了，对吧？呃，是的。当然。表层问题解决了，但现在两个老问题——溢出和舍入——又抬起它们丑陋的头。

下面是“*x*/12”计算的代码。ARM 编译的代码为 1/12 创建了一个 .33 定点数，然后用 64 位乘法做除法。另一方面，Thumb 版本没有（确实也不能）这么做，而是用了标准、慢速的除法例程。如果你想摆脱这个耗时的除法，你得自己处理。说明一下，是的我知道即便你懂 ARM 汇编，它为什么这么做也可能很难跟上。这正是本节的目的。

```armasm
@ Calculating y= x/12

@ === Thumb version ===
    ldr     r0, .L0     @ load numerator
    ldr     r0, [r0]
    mov     r1, #12     @ set denominator
    bl      __divsi3    @ call the division routine
    ldr     r1, .L0+4
    str     r0, [r1]
.L0:
    .align  2
    .word   x
    .word   y

@ === ARM version ===
    ldr     r1, .L1         @ Load M=2^33/12
    ldr     r3, .L1+4
    ldr     r3, [r3]        @ Load x
    smull   r2, r0, r1, r3  @ r0,r2= x*M (64bit)
    mov     r3, r3, asr #31     @ s = x>=0 ? 0 : -1 (for sign correction)
    rsb     r3, r3, r0, asr #1  @ y= (x*M)/2 - s = x/12
    ldr     r1, .L1+8
    str     r3, [r1]        @  store y
.L1:
    .align  2
    .word   715827883   @ 0x2AAAAAAB (≈ 2^33/12 )
    .word   x
    .word   y
```

本节其余部分是关于识别和处理这些问题，以及推导该技术安全使用的一些准则。但首先，我们需要一些定义。

整数除法；正整数 *p*、*q*、*r*

<!--
r = \left\lfloor p/q \right\rfloor \iff p = r \cdot q + p \text{%}q
-->
<table id="eq:int-div">
<tr>
  <td class="eqnrcell">(!@eq:int-div)</td>
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>r</mi>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">&#x230A;</mo>
              <mi>p</mi>
              <mrow data-mjx-texclass="ORD">
                <mo>/</mo>
              </mrow>
              <mi>q</mi>
              <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
            </mrow>
            <mstyle scriptlevel="0">
              <mspace width="0.278em"></mspace>
            </mstyle>
            <mo stretchy="false">&#x27FA;</mo>
            <mstyle scriptlevel="0">
              <mspace width="0.278em"></mspace>
            </mstyle>
            <mi>p</mi>
            <mo>=</mo>
            <mi>r</mi>
            <mo>&#x22C5;</mo>
            <mi>q</mi>
            <mo>+</mo>
            <mi>p</mi>
            <mo>%</mo>
            <mi>q</mi>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
  </td>
</tr>
</table>

近似；正整数 *x*、*y*、*a*、*m*、*n* 和真实误差项 δ

<!--
y = \left\lfloor x/a \right\rfloor = \left\lfloor (x \cdot m)/n \right\rfloor + \delta
-->
<table id="eq:div-aprx">
<tr>
  <td class="eqnrcell">(!@eq:div-aprx)</td>
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>y</mi>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">&#x230A;</mo>
              <mi>x</mi>
              <mrow data-mjx-texclass="ORD">
                <mo>/</mo>
              </mrow>
              <mi>a</mi>
              <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
            </mrow>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">&#x230A;</mo>
              <mo stretchy="false">(</mo>
              <mi>x</mi>
              <mo>&#x22C5;</mo>
              <mi>m</mi>
              <mo stretchy="false">)</mo>
              <mrow data-mjx-texclass="ORD">
                <mo>/</mo>
              </mrow>
              <mi>n</mi>
              <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
            </mrow>
            <mo>+</mo>
            <mi>&#x3B4;</mi>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
  </td>
</tr>
</table>

我用下取整（&#x230A;*p*/*q*&#x230B;）表示整数除法，它基本是真除法的向下取整版本。和通常一样，模（modulo）是余数，通常用 *p* − *r·q* 计算。近似 1/*a* 的关键在于项 *m* 和 *n*。在我们的情形里 *n* 会是 2 的幂 *n*=2<sup>F</sup>，这样我们可以用移位，但没必要。δ 是任何近似都固有的误差项。注意我这里只用了正整数；对负数，如果你想模仿“真”除法，需要给结果加一。（或者，减去符号位，这同样有效，正如你在上面 ARM 汇编里看到的。）

:::note 伪造负除法与取整

本节关于正数。如果你想要标准的整数除法结果（向零取整），当分子为负时你得加一。这通过减去符号位可以快速完成。

```c
// pseudo-code for division by constant M
int x, y;
y= fake_div(x, M);  // shift-like div
y -= y>>31;         // convert to /-like division
```

如果你要向负无穷取整，你得做点别的。但我不太确定是什么，老实说。

:::

### 原理 {#ssec-rmdiv-try}

成功需要两样东西。首先，找 *m* 的方法。其次，判断近似何时会失效的方法。后者可从 @eq:div-aprx 推导。近似的误差由 &#x230A;ε/*n*&#x230B; 给出，所以只要它是零你就安全。

<!--
x \cdot m - n \cdot \left\lfloor x/A \right\rfloor = \varepsilon \\
\text{Fail if: } \varepsilon \ge n
-->
<table id="eq:aprx-fail">
<tr>
  <td class="eqnrcell">(!@eq:aprx-fail)</td>
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>x</mi>
            <mo>&#x22C5;</mo>
            <mi>m</mi>
            <mo>&#x2212;</mo>
            <mi>n</mi>
            <mo>&#x22C5;</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">&#x230A;</mo>
              <mi>x</mi>
              <mrow data-mjx-texclass="ORD">
                <mo>/</mo>
              </mrow>
              <mi>A</mi>
              <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
            </mrow>
            <mo>=</mo>
            <mi>&#x3B5;</mi>
          </mtd>
        </mtr>
        <mtr>
          <mtd>
            <mtext>Fail if:&#xA0;</mtext>
            <mi>&#x3B5;</mi>
            <mo>&#x2265;</mo>
            <mi>n</mi>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </mstyle>
</math>
  </td>
</tr>
</table>

至于找 *m*。回想 &#x230A;1/*A*&#x230B; = &#x230A;(*n·A*)/*n*&#x230B;，所以似乎用 *m* = &#x230A;*n*/*A*&#x230B; 会是个好值。然而，并非如此。

这大概是举个例子的好时机。考虑 *A* = 3 的情况，就像一开始那样。我们这里用 .8 定点数，也就是说 *k* = 8 且 *n*=256。我们的试探 *m* 于是就是 *m* = &#x230A;*n*/*A*&#x230B; = 85 = 0x55，余数为 1。

另一种看待它的方式是转到十六进制浮点并取前 *F* 位。这没你想的那么难。找分数浮点数的方法是乘基数，写下整数部分，把余数乘基数，写下整数部分，如此继续。下面的表是 1/7 的十六进制版本（我没用 1/3 是因为那相当单调）。如你所见，十六进制里 1/7 是 0.249249…h。对三分之一做这个，你会得到 0.5555…h。

<div class="lblock">
<table id="tbl:hexfloat" class="table-data">
<caption align="bottom">
  <b>*@tbl:hexfloat</b>： 
  以基 <i>B</i>=16 表示的 1/7 的浮点形式
</caption>
<tbody align="center">
<tr><th> x <th> x&middot;B <th> x&middot;&#x230A;B/7&#x230B; <th> x&middot;B%7
<tr><th width=16> 1 <td> 16  <td> 2     <td> 2
<tr><th> 2 <td> 32  <td> 4     <td> 4
<tr><th> 4 <td> 64  <td> 9     <td> 1
<tr><th> 1 <td> 16  <td> 2     <td> 2
<tr><th> 2 <td> 32  <td> 4     <td> 4
</tbody>
</table>
</div>

所以十六进制里 1/3 是零，后面跟着一串五，或者说在截断的 .8 定点数记法里就是 *m*=0x55。现在看当你做乘倒数那套时会发生什么。这里我用十六进制浮点，且 *y*=&#x230A;(*x·m*)/*n*&#x230B;，如 @eq:div-aprx。你实际得到的是整数部分，忽略（十六进制）小数

<div class="cblock">
<table id="tbl:rmdiv-bad" class="table-data">
<caption align="bottom">
  <b>*@tbl:rmdiv-bad</b>： 
  <i>x</i>/3，使用 <i>m</i>= &#x230A;256/3&#x230B; = 0x55。在 3、6 等处出错……
</caption>
<tbody align="center">
<tr><th>x
  <th> 0 <th> 1 <th> 2 <th> 3 <th> 4 <th> 5 <th> 6 <th> 7
<tr><th>y=(x&middot;m)&gt;&gt;F
  <td> 0.00h        <td> 0.55h <td> 0.AAh 
  <td> <b>0.FFh</b> <td> 1.54h <td> 1.A9h
  <td> <b>1.FEh</b> <td> 2.53h
<tr><th>true <i>x</i>/3
  <td> 0 <td> 0 <td> 0 <td> 1 <td> 1 <td> 1 <td> 2 <td> 2
</tbody>
</table>
</div>

如你所见，问题几乎 *立刻* 就出现了！你甚至还没到 *x*=*A* 就遇到麻烦。这 *不是* 精度问题：你可以用 .128 定点数，它还是偏的。这纯粹是<dfn>舍入误差（round-off error）</dfn>的结果，用浮点也会一样发生。当你用倒数除法时，*m* 应当向上取整，而非向下。你可以用对齐技巧：先加 *A*−1，再除。现在 *m*=0x56，你就安全了。至少，暂时。

<!--
m = \left\lfloor (n+A-1)/A \right\rfloor
-->
<table id="eq:reci-m">
<tr>
  <td class="eqnrcell">(!@eq:reci-m)</td>
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>m</mi>
            <mo>=</mo>
            <mrow data-mjx-texclass="INNER">
              <mo data-mjx-texclass="OPEN">&#x230A;</mo>
              <mo stretchy="false">(</mo>
              <mi>n</mi>
              <mo>+</mo>
              <mi>A</mi>
              <mo>&#x2212;</mo>
              <mn>1</mn>
              <mo stretchy="false">)</mo>
              <mrow data-mjx-texclass="ORD">
                <mo>/</mo>
              </mrow>
              <mi>A</mi>
              <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
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

<div class="cblock">
<table id="tbl:rmdiv-good" class="table-data">
<caption align="bottom">
  <b>*@tbl:rmdiv-good</b>： 
  <i>x</i>/3，使用 <i>m</i>= &#x230A;(256+2)/3&#x230B; = 0x56。在 3、6 等处仍然正确……
</caption>
<tbody align="center">
<tr><th>x
  <th> 0 <th> 1 <th> 2 <th> 3 <th> 4 <th> 5 <th> 6 <th> 7
<tr><th>y=(x&middot;m)&gt;&gt;F
  <td> 0.00h <td> 0.56h <td> 0.ACh 
  <td> 1.02h <td> 1.58h <td> 1.AEh
  <td> 2.04h <td> 2.5Ah
<tr><th>true <i>x</i>/3
  <td> 0 <td> 0 <td> 0 <td> 1 <td> 1 <td> 1 <td> 2 <td> 2
</tbody>
</table>
</div>

是的，你安全了。但能安全多久？最终，你会达到一个 *x* 值，在那里会有麻烦。这次关乎精度。幸运的是，你能为 *x* 和 *n* 推导出安全限度，说明事情何时会变糟。真实范围可能稍好一点，因为 @eq:aprx-fail 的误差条件会跳来跳去，但小心驶得万年船。推导从 @eq:aprx-fail 开始，用到 @eq:int-div 和一个关于模的技巧，即 *p*%*q* ∈ \[0, *q*⟩。

<!--
\begin{matrix}
x \cdot m - n \left\lfloor x/A \right\rfloor & < & n &  \\
x \cdot m \cdot a - n \left\lfloor x/A \right\rfloor A & < & n \cdot A & \text{[insert } \left\lfloor x/A \right\rfloor A=x-x \text{%} A \text{]} \\
x \cdot m \cdot A - n \cdot x + n(x \text{%} A) & < & n \cdot A & \text{[insert } \max(x \text{%} A) = A - 1 \text{]} \\
x(m \cdot A - n) + n(A - 1) & < & n \cdot A &  \\
x(m \cdot A - n) & < & n & 
\end{matrix}
-->
<table id="eq:lims">
<tr>
  <td class="eqnrcell" rowspan=6>(!@eq:lims)</td>
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
                  <mi>x</mi>
                  <mo>&#x22C5;</mo>
                  <mi>m</mi>
                  <mo>&#x2212;</mo>
                  <mi>n</mi>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">&#x230A;</mo>
                    <mi>x</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mo>/</mo>
                    </mrow>
                    <mi>A</mi>
                    <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
                  </mrow>
                </mtd>
                <mtd>
                  <mo>&lt;</mo>
                </mtd>
                <mtd>
                  <mi>n</mi>
                </mtd>
                <mtd></mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>x</mi>
                  <mo>&#x22C5;</mo>
                  <mi>m</mi>
                  <mo>&#x22C5;</mo>
                  <mi>a</mi>
                  <mo>&#x2212;</mo>
                  <mi>n</mi>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">&#x230A;</mo>
                    <mi>x</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mo>/</mo>
                    </mrow>
                    <mi>A</mi>
                    <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
                  </mrow>
                  <mi>A</mi>
                </mtd>
                <mtd>
                  <mo>&lt;</mo>
                </mtd>
                <mtd>
                  <mi>n</mi>
                  <mo>&#x22C5;</mo>
                  <mi>A</mi>
                </mtd>
                <mtd>
                  <mtext>[insert&#xA0;</mtext>
                  <mrow data-mjx-texclass="INNER">
                    <mo data-mjx-texclass="OPEN">&#x230A;</mo>
                    <mi>x</mi>
                    <mrow data-mjx-texclass="ORD">
                      <mo>/</mo>
                    </mrow>
                    <mi>A</mi>
                    <mo data-mjx-texclass="CLOSE">&#x230B;</mo>
                  </mrow>
                  <mi>A</mi>
                  <mo>=</mo>
                  <mi>x</mi>
                  <mo>&#x2212;</mo>
                  <mi>x</mi>
                  <mo>%</mo>
                  <mi>A</mi>
                  <mtext>]</mtext>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>x</mi>
                  <mo>&#x22C5;</mo>
                  <mi>m</mi>
                  <mo>&#x22C5;</mo>
                  <mi>A</mi>
                  <mo>&#x2212;</mo>
                  <mi>n</mi>
                  <mo>&#x22C5;</mo>
                  <mi>x</mi>
                  <mo>+</mo>
                  <mi>n</mi>
                  <mo stretchy="false">(</mo>
                  <mi>x</mi>
                  <mo>%</mo>
                  <mi>A</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
                <mtd>
                  <mo>&lt;</mo>
                </mtd>
                <mtd>
                  <mi>n</mi>
                  <mo>&#x22C5;</mo>
                  <mi>A</mi>
                </mtd>
                <mtd>
                  <mtext>[insert&#xA0;</mtext>
                  <mo data-mjx-texclass="OP" movablelimits="true">max</mo>
                  <mo stretchy="false">(</mo>
                  <mi>x</mi>
                  <mo>%</mo>
                  <mi>A</mi>
                  <mo stretchy="false">)</mo>
                  <mo>=</mo>
                  <mi>A</mi>
                  <mo>&#x2212;</mo>
                  <mn>1</mn>
                  <mtext>]</mtext>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>x</mi>
                  <mo stretchy="false">(</mo>
                  <mi>m</mi>
                  <mo>&#x22C5;</mo>
                  <mi>A</mi>
                  <mo>&#x2212;</mo>
                  <mi>n</mi>
                  <mo stretchy="false">)</mo>
                  <mo>+</mo>
                  <mi>n</mi>
                  <mo stretchy="false">(</mo>
                  <mi>A</mi>
                  <mo>&#x2212;</mo>
                  <mn>1</mn>
                  <mo stretchy="false">)</mo>
                </mtd>
                <mtd>
                  <mo>&lt;</mo>
                </mtd>
                <mtd>
                  <mi>n</mi>
                  <mo>&#x22C5;</mo>
                  <mi>A</mi>
                </mtd>
                <mtd></mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mi>x</mi>
                  <mo stretchy="false">(</mo>
                  <mi>m</mi>
                  <mo>&#x22C5;</mo>
                  <mi>A</mi>
                  <mo>&#x2212;</mo>
                  <mi>n</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
                <mtd>
                  <mo>&lt;</mo>
                </mtd>
                <mtd>
                  <mi>n</mi>
                </mtd>
                <mtd></mtd>
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

由此结果，我们可以轻松算出给定 *A* 和 *n* 的最大有效 *x*：

<table id="eq:lim-x">
<tr>
  <td class="eqnrcell">(!@eq:lim-x)
  <td class="eqcell"><i>x</i> &lt; <i>n</i> / 
    (<i>m&middot;A</i> &minus; <i>n</i>)
</table>

*n* 的下限由这个事实得出：由 (6) 知，max(*m·A*) = *n*+*A*−1，所以：

<table id="eq:lim-n">
<tr>
  <td class="eqnrcell">(!@eq:lim-n)
  <td class="eqcell"><i>n</i> &gt; <i>x</i>(<i>A</i>&minus;1)
</table>

基本就这些。当然还有一点多出来的东西。由于你要做乘法，乘积 *m·A* 必须能装进一个变量。所以数字的实际上限约为 16 位。你有时可以通过移出 *A* 的低零位来稍微缓解这个限制。例如，对 *A*=10=5·2，你可以在整个计算前先把 *x* 右移一次。甚至 360 也是 45·8，这样你能省下三位。还有，注意即便你超过限度，结果仍正确的可能性很大，或者只差一点点（看 @eq:aprx-fail）。那样你应该能相对快地找到真答案。

:::tip ARM 的“int/const int”除法总是安全

我们现在能看到为什么 GCC 总能安全地优化 32 位除法。32 位 *x* 和 *A* 的上限当然是 2<sup>32</sup>。它的安全限度是 2<sup>64</sup>−2<sup>32</sup>，这总能装进 `smull` 的 64 位结果。

:::

当然，你不会想一直把这些东西打进去。所以这里有两个能替你干活的宏。它们看着吓人，但预处理器和编译器知道怎么处理。我建议别把它们转成内联函数，因为不知为何你很可能会丢掉代码本应带来的任何好处。

```c
// Division by reciprocal multiplication
// a, and fp _must_ be constants

//! Get the reciprocal of \a a with \a fp fractional bits
#define FX_RECIPROCAL(a, fp)    ( ((1<<(fp))+(a)-1)/(a) )

//! Division of x/a by reciprocal multiplication
#define FX_RECIMUL(x, a, fp)    ( ((x)*((1<<(fp))+(a)-1)/(a))>>(fp) )
```

### 总结 {#ssec-rmdiv-sum}

永远别忘了这是个有点 hack 的东西，且 **只** 在 *A* 是常数时有效。整点的目的是让除法发生在编译时而非运行时，而只有 *A* 是常数才有可能。常数好的一点是它们按定义是预先知道的。负值和大抵 2 的幂若需要也可以在编译时解决。

倒数乘数 *m* 并 *不* 仅仅是 &#x230A;*n*/*A*&#x230B;，原因是舍入误差。总是向上取整。换句话说：

> *m* = &#x230A;(*n*+*A*−1) / *A*&#x230B;

然后是除法失效的问题，即近似与“真”的 &#x230A;*x*/*A*&#x230B; 不同的情况。确切条件其实无关紧要，但知道 *x* 的安全范围、以及反过来对给定 *x* 范围你需要什么 *n* 是有用的。同样，因为重要项都是常数，它们可以提前算好。注意下面给的关系代表的是 *A* 的限度，而非 *那个* 限度。失效的实际数字可能松一点，但取决于环境，而那些环境相关的关系会更复杂。

> *x* \< *n* / (*m·a* − *n*)

> *n* \> *x*(*A*−1)

最后，如果你完全搞不懂这整节在说什么，我建议别用这个策略。它是个部分安全的除法优化技术，虽然它能比普通除法快不少，但在非关键区域可能不值得。只是，用你的判断。

:::note 替代方法

倒数乘法有一个替代方法：与其把 *n*/*A* 向上取整，你也可以给 *x* 加 1，得到

> *y* = &#x230A;*x* / *A*&#x230B; ≈ (*x*+1) × &#x230A;*N* / *A* / *N*&#x230B;

这也会消除 @tbl:rmdiv-bad 描述的问题。安全条件和之前几乎一样，但对负 *x* 的除法有些区别。如果你 *真的* 必须知道，细节可以按需提供。

:::

## 查找表（LUT） {#sec-lut}

<dfn>查找表（look-up table）</dfn>（或称 <dfn>LUT</dfn>）嘛，嗯，就是一张你用来查找东西的表。这相当显然，不是吗？重点是你能做得真的 *很快*。举个简单的例，2<sup>5</sup> 是多少，3<sup>5</sup> 是多少？真正的程序员（应该）会立刻知道第一个，但另一个可能要花稍长点时间去找。为什么？因为但凡有点自尊的程序员都把 2 的幂记在心里，至少到 2<sup>10</sup>。2 的幂在编程中如此频繁出现，你已经把答案背下来了——你一看到“2<sup>5</sup>”这个问题，你不会通过重复乘法去算答案，你的大脑只是简单地在记忆里 **查** 它，几乎不假思索地给出答案。十进制乘法表也一样：7×8？56，就这样。但换成比如 3 的幂或十六进制乘法，过程就失败了，你得用又难又长的老办法。我想说的是：当你能直接查到时，事情能快得多，而不必做正确的计算。

查找表的概念对计算机也成立，否则我不会提它。这种情况下，查找表不过是一个你塞满你觉得可能需要查的东西的数组。

### 示例：正弦/余弦查找表 {#ssec-lut-sin}

经典例子是三角学 LUT。正弦和余弦是昂贵的操作，在 GBA 上尤其，所以最好做一个它们的表，你只需花费一次内存访问，而非经历两次（昂贵的）类型转换、浮点函数。一个简单的做法是创建两个 FIXED 数组，比如各 360 个元素（每个角度一个），在游戏开始时填好。

```c
#define PI 3.14159265
#define DEGREES    360      // Full circle

FIXED sin_lut[DEGREES], cos_lut[DEGREES];

// A really simple (and slow and wasteful) LUT builder
void sincos_init()
{
    const double conv= 2*PI/DEGREES;
    for(int ii=0; ii<DEGREES; ii++)
    {
        sin_lut[ii]= (FIXED)(sin(conv*ii)*FIX_SCALEF);
        cos_lut[ii]= (FIXED)(cos(conv*ii)*FIX_SCALEF);
    }
}
```

然而，这个特定方法有严重缺陷。是的，它能工作，是的，它简单，但绝对有改进空间。先说一个如果你用这个函数会立刻可见的问题，它实际上要花几 *秒* 才能完成。是的，标准三角例程就是这么慢。这是个相当温和的问题，因为你只需调用一次，但仍是问题。此外，因为数组不是常数，它们被放进 IWRAM。那基本上是把 10% 的 IWRAM 浪费在除了初始化外从不改变的东西上。有几个办法改进这两点，比如利用正弦-余弦对称性来减少计算时间并让表重叠，但为什么要在游戏里计算它们呢？在 PC 上预计算这些表，再把数据导出成数组一样容易：那样它们就是常数（即不霸占 IWRAM），而且 GBA 不必为它们的初始化花一个周期。

第二个改进是用更高的定点小数。正弦和余弦的范围是 \[−1, +1\]。这意味着对 LUT 用 8.8 定点数，我其实在浪费 6 个本可用于更高精度的位。所以我要做的是用 4.12 定点数。是的，你可以上到 .14 定点数，但 12 是个更漂亮的数。

最后一点改进，我不打算用 360 个单位表示一个圆，而是用一个 2 的幂；这里是 512。这有两个好处：

-   对环绕（α\<0 或 α\>2π），我可以用位掩码而非 if 语句或 \*倒吸一口气\* 取模。
-   因为余弦只是偏移的正弦，且因为第一点，我现在只需要一张表就能覆盖两种波形，并且可以用偏移角度和掩码环绕从一种波形得到另一种。

这两点都能让生活轻松许多。

说明一下，这么做完全没问题。正弦和余弦的形式来自沿单位圆周长行进；那条路径上的划分数是任意的。360 有历史意义，但也仅此而已。面对现实吧，你也说不清一“度”是多少，重要的是圆的划分。360° 是一整圆，90° 是四分之一圆，等等。现在一整圆是 512，128（512/4）是四分之一，如此类推。一个简单粗糙的 sin LUT 生成器大概长这样。总结一下：

-   在 GBA 之外预计算 LUT，像普通 const 数组一样链接进来。
-   用 4.12 定点数而非 4.8。
-   把 LUT 分成 2 的幂（如 512），而非 360。

```c
// Example sine LUT generator
#include <stdio.h>
#include <math.h>

#define M_PI 3.1415926535f
#define SIN_SIZE 512
#define SIN_FP 12

int main()
{
    int ii;
    FILE *fp= fopen("sinlut.c", "w");
    unsigned short hw;

    fprintf(fp, "//\n// Sine LUT; %d entries, %d fixeds\n//\n\n", 
        SIN_SIZE, SIN_FP);
    fprintf(fp, "const short sin_lut[%d]=\n{", SIN_SIZE);
    for(ii=0; ii<SIN_SIZE; ii++)
    {
        hw= (unsigned short)(sin(ii*2*M_PI/SIN_SIZE)*(1<<SIN_FP));
        if(ii%8 == 0)
            fputs("\n\t", fp);
        fprintf(fp, "0x%04X, ", hw);
    }
    fputs("\n};\n", fp);

    fclose(fp);
    return 0;
}
```

它创建一个文件 sinlut.c，其中包含一个 512 半字的数组 `sin_lut`。注意虽然我这里创建的是 C 文件，你同样可以在汇编文件里建表，甚至就作为二进制文件，之后以某种方式链接到项目。实际找正弦和余弦值通过 `lu_sin()` 和 `lu_cos()` 函数。

```c
// Sine/cosine lookups. 
// NOTE: theta's range is [0, 0xFFFF] for [0,2π⟩, just like the 
// BIOS functions

//! Look-up a sine value
INLINE s32 lu_sin(u32 theta)
{   return sin_lut[(theta>>7)&0x1FF];   }

//! Look-up a cosine value
INLINE s32 lu_cos(u32 theta)
{   return sin_lut[((theta>>7)+128)&0x1FF]; }
```

#### 关于 excellut

我其实没用上面展示的生成器来生成 libtonc 的 LUT。相反，我用的是自己的 [excellut](http://www.coranac.com/projects/#excellut)。这不是程序，而是个 Excel 文件。是的，我说的是 Excel。用电子表格程序建 LUT 的好处是你能用它做 *任何* 种类的数学表，测试它是否有想要的精度，并绘图等等。然后当你满意了，就可以以你选择的方式导出电子表格的一部分。这种灵活性如何？

#### 精度与分辨率

这是建 LUT 时要考虑的两件主要事情。<dfn>精度（Accuracy）</dfn> 关乎每个条目中有意义位的位数；<dfn>分辨率（resolution）</dfn> 是各条目在自变量空间上相隔多远。两者都是越大越好，但当然有空间上的权衡。需要折衷，再一次，这非常取决于你打算拿它做什么。

对精度，你需要考虑函数的范围。如前所述，正弦范围是 \[−1, +1\]，用 8.8 定点数会浪费 6 个本可用于更高有效位的位。对我用于[第一个 mode 7 章](mode7.html)的除法 LUT，我需要 1/1 到 1/160，那用 .8 定点数 *不* 会好用，所以我在那里用 .16 定点数，它可能仍不够，但更高可能引发溢出问题。

第二个问题，分辨率，和你有多少条目绑定。即便你有无尽的精度，如果它们摊得太稀也没多大用。这类似于屏幕分辨率：即便有 32 位色，如果你只有 17 英寸显示器、320×240 分辨率，东西看着也会很糟。另一方面，过高的分辨率如果精度跟不上也没用。多数值得做 LUT 的函数会是平滑曲线，对任何给定精度，你会达到一个点，再增加分辨率只会往 LUT 里加相同的值，那会浪费空间。记住，如果你确实需要，必要时总能做插值。

例如，我的 512、8.8 定点数正弦 LUT 的头几个值读出来是“0x0000, 0x0003, 0x0006, 0x0009”，那正是导数最大的地方，所以这是你会看到的最大相邻差值。如果我把分辨率提高四倍，差值会在最后一位；再高就无用，除非我也提高精度。

所以实际上是三方折衷。精度与分辨率之间（函数的导数会有帮助找到这个平衡）需要平衡，而这两者又要与你想分配给 LUT 的 ROM 空间相抗衡。再一次，能判断正确平衡点的只有你。

### 查找表的线性插值 {#ssec-lut-lerp}

查找表本质上是函数采样得到的一堆点。如果你总是访问数组的这些点，那没问题，但如果你想取点之间的位置呢？一个例子是定点数角度，比如（余）弦内联函数里的 `theta`。通常，定点数的低位是直接截掉，用前面的点。虽然快，但结果会有一定精度损失。

<div class="cpt_fr" style="width:256px;">
  <img src="img/math/lutlerp.png" id="fig:lerp" 
    alt="lut lerp" width=256><br>
  <b>*@fig:lerp</b>: 通过直接 
  查找或线性插值来近似一个正弦。
</div>

更准确的解决方案是用周围的点插值到想要的点。其中最简单的是<dfn>线性插值（linear interpolation）</dfn>（或称 <dfn>lerp</dfn>）。假设你有点 *x*<sub>a</sub> 和 *x*<sub>b</sub>，函数值分别为 *y*<sub>a</sub> 和 *y*<sub>b</sub>。这可用来定义一条直线。点 *x* 的函数值于是可以插值得到：

<table id="eq:lerp">
<tr>
  <td class="eqnrcell">(!@eq:lerp)
  <td class="eqcell">
    <i>y</i> = 
  <td class="eqcell">
	<table>
	  <tr><td class="bdrB"><i>y</i><sub>b</sub> &minus; <i>y</i><sub>a</sub>
	  <tr><td><i>x</i><sub>b</sub> &minus; <i>x</i><sub>a</sub>
	</table>
  <td class="eqcell">
    (<i>x</i> &minus; <i>x</i><sub>a</sub>) + <i>y</i><sub>a</sub>
</table>

*@fig:lerp 给出了线性插值能带来区别的示例。这里我有一个以 16 点采样、.12f 精度的正弦函数。蓝线是真实的正弦函数。品红线是用前一点直接查找的结果，黄线是 lerp。注意蓝线和黄线几乎一样，但品红线可能差很多。考虑 *x* = 4.5，用红色给出。LUT 值偏差 8.5%，但 lerp 值只偏差 0.5%：那好了 16 倍！确实，这是个夸张的例子，但 lerp 能带来巨大差异。

那么怎么实现？嗯，本质上用 @eq:lerp。里面的除法看着吓人，但记住相邻点的差总是 1——对定点数则是 2 的幂。一个高效实现会是：

```c
//! Linear interpolator for 32bit LUTs.
/*! A LUT is essentially the discrete form of a function, f(\i x).
*   You can get values for non-integer \i x via (linear) 
*   interpolation between f(x) and f(x+1).
*   \param lut  The LUT to interpolate from.
*   \param x    Fixed point number to interpolate at.
*   \param shift    Number of fixed-point bits of \a x.
*/
INLINE int lu_lerp32(const s32 lut[], int x, const int shift)
{
    int xa, ya, yb;
    xa=x>>shift;
    ya= lut[xa]; yb= lut[xa+1];
    return ya + ((yb-ya)*(x-(xa<<shift))>>shift);
}
```

那是给 32 位 LUT 用的版本，还有一个 16 位版本叫 `lu_lerp16()`，主体相同，只是声明不同。在 C++ 里这会是个不错的函数模板。

这些函数适用于每种 LUT，除了在上界处有个小麻烦。假设你有 *N* 个条目的 LUT。函数用了 *x*+1，而 *N*−1 和 *N* 之间的最后区间很可能不存在。这会在那一点严重搞乱插值。与其作为特例处理，不如给 LUT 加一个点。实际上 `sinlut` 有 513 个点，而非 512。（实际上，为了字对齐它有 514 个点，但那不是重点。）

:::warning 在上界处 lerp

线性插值需要 *x* 上下两侧的采样点，这会在上界处引发问题。在那里加一个采样点来“把围栏合上”，就像那样。

:::

直接查找也被称为 0 阶插值；线性插值是 1 阶。更高阶也存在，但需要更多周围点和更多更复杂的计算。只有在你真的、真的必须时才去尝试那些。

### 非数学的查找表 {#ssec-lut-nomath}

虽然查找表最明显的用途是预计算数学函数，但 LUT 不限于数学。在我的[文本系统](text.html)里，例如，我用查找表做字符→图块索引的转换。这给了我比原本可能的更广的图块分布范围。默认字体用 ASCII 字符 32-127，这些图块通常在图块 0 到 95。但如果出于某种原因我只需要数字图块，我可以只为数字设置字符 LUT，文本系统会从那里接管。其余图块就空出来作他用。

另一个用途是标志查找。Visual C++ 附带的库用 LUT 做字符类型例程 `isalpha()`、`isnum()` 之类。有一张带位标志的表，你用这些例程时它们只抓取恰当的元素并做一点位测试。你在游戏编程里也能找到类似的，比如一张带图块类型位标志的表：背景、可走、陷阱，等等。与其用庞大的 switch 块，你可能只需做一次数组查找，那快得多。

