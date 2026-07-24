# 10. 仿射变换矩阵（即 **P**）

<!-- toc -->

## 关于本页

正如你可能知道的那样，GBA 能够对精灵(对象)和背景施加旋转和/或缩放等几何变换。为了把它们与常规项目区分开来，这些可变换的对象通常被称为旋转/缩放（Rot/Scale）精灵和背景。这些变换由四个参数 `pa`、`pb`、`pc` 和 `pd` 描述。对于精灵和背景来说，它们的位置和确切名称有所不同，但眼下这并不重要。

有两种方式来理解这些数字。第一种是把它们看作各自独立的、作用于精灵和背景数据的偏移量。这正是 [GBATEK](https://problemkaputt.de/gbatek.htm) 和 [CowBite Spec](http://www.cs.rit.edu/~tjh8300/CowBite/CowBiteSpec.htm) 这类参考文档描述它们的方式。另一种方式则是把它们看作一个 2×2 矩阵的元素，我将其称为 **P**。几乎所有教程都是这样描述的。这些教程还会给出如下用于旋转和缩放的矩阵：

<math id="eq:incorrect_transform_matrix" class="block">
    <mo>(</mo>
    <mi>{!@eq:incorrect_transform_matrix}</mi>
    <mo>)</mo>
    <mspace width="30px" />
    <mi>𝗣</mi>
    <mo>=</mo>
    <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd><msub><mi>p</mi><mi>a</mi></msub></mtd>
                <mtd><msub><mi>p</mi><mi>b</mi></msub></mtd>
            </mtr>
            <mtr>
                <mtd><msub><mi>p</mi><mi>c</mi></msub></mtd>
                <mtd><msub><mi>p</mi><mi>d</mi></msub></mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
    <mo>=</mo>
    <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd><msub><mi>s</mi><mi>x</mi></msub><mi>cos</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
                <mtd><msub><mi>s</mi><mi>y</mi></msub><mi>sin</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
            </mtr>
            <mtr>
                <mtd><mo>-</mo><msub><mi>s</mi><mi>x</mi></msub><mi>sin</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
                <mtd><msub><mi>s</mi><mi>y</mi></msub><mi>cos</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
</math>

现在，这确实是一个旋转加缩放矩阵。不幸的是，它同时也是<span class="rem">错误</span>的那一个！或者至少，它很可能不会按你预期的那样工作。举例来说，考虑缩放 <math><msub><mi>s</mi><mi>x</mi></msub></math> = 1.5、<math><msub><mi>s</mi><mi>y</mi></msub></math> = 1.0，旋转角 α = 45 的情况。你大概会预期得到类似 {@fig:rotatescale}a 的结果，但你实际得到的却是 {@fig:rotatescale}b。精灵确实旋转了，但方向错了，它非但没有放大反而缩小了，而且还多出了一个切变。当然，你大可以说你本来就是想要这种效果的，但那多半并非实情。

<div style="display: flex; margin: 20px">
<div class="cpt" style="width:160px;">

<img src="./img/affine/metr_rs_good.png" id="fig:rotatescale">  

**{*@fig:rotatescale}a**：当你说“旋转并缩放”时，你预期的很可能是这样的……

</div>
&nbsp;
<div class="cpt" style="width:160px">
<img src="./img/affine/metr_rs_bad.png" id="fig:rotatescale">  


**{*@fig:rotatescale}b**：但使用 {@eq:incorrect_transform_matrix} 中的 **P**，你得到的却是这个。
</div>
</div>

遗憾的是，关于变换矩阵存在大量不正确或具有误导性的信息；{@eq:incorrect_transform_matrix} 中的矩阵只是其中一个方面。这实际上要从“Rot/Scale”这个绰号说起，它并不符合实际发生的情况；接着是这样一个事实：所使用的术语从未被正确地定义过，而且大多数人往往只是互相复制粘贴，连停下来想一想这些信息是否正确都不愿意。讽刺的是，权威的参考文档 GBATEK 对每个元素都给出了正确的描述，但在教程里翻译成矩阵形式的环节中，这些正确信息 somehow 丢失了。

在本章中，我会给出 **P** 矩阵的<strong>正确</strong>解读：GBA 是如何使用它的，以及你该如何自己构建它。不过，要做到这一点，我得完全进入数学模式。如果你对向量和矩阵运算不太熟悉，可能会在理解文中那些细微之处时遇到一些困难。关于这个主题，[线性代数](matrix.html) 附录中给出了一些指引。

这将是一个纯粹理论性的页面：你在这里找不到任何与精灵或背景直接相关的内容；那是接下来两节要讲的东西。我们再次请出可爱的 metroid（请冷藏保存以备安全使用）。请注意 y 轴的方向和角度的定义，并且在没有读完[收尾](#sec-finish)段落之前<strong>不要</strong>离开。那段包含了若干关键的实现细节，在之前的文字中我故意略去不谈，因为它们在那个阶段只会碍事。

:::warning 请警惕那些讲解仿射参数的文档

这是真的。我见过的几乎每一份涉及这个主题的文档，都在某些方面存在问题。其中很多都给出了错误的旋转-缩放矩阵（即 {@eq:incorrect_transform_matrix} 中的那一个），或者错误地命名和/或错误地表述了矩阵及其元素。

:::

## 纹理映射与仿射变换。

### 通用 2D 纹理映射

GBA 把精灵和图块背景显示到屏幕上的方式，与纹理映射非常相似。所以现在先忘掉 GBA，来看看纹理映射是怎么做的。在 {@fig:metroid_texture}a 中，我们看到一张 metroid 纹理。为了方便，我使用了标准的笛卡尔二维坐标系（y 轴向上），并对纹理做了归一化处理，也就是说，纹理的右侧和顶侧分别与单位向量 <math><msub><mi>e</mi><mi>x</mi></msub></math> 和 <math><msub><mi>e</mi><mi>y</mi></msub></math>（长度为 1）精确对应。纹理映射把纹理空间中的点 **p** 映射到屏幕空间中的点 **q**。实际的映射由一个 2×2 矩阵 **A** 完成：

<math class="block">
    <mi>𝗾</mi>
    <mo>=</mo>
    <mi>𝗔</mi>
    <mo>&middot;</mo>
    <mi>𝗉</mi>
</math>

那么该如何求 **A** 呢？嗯，其实没那么难。该矩阵是由变换后的基向量（即 **u** 和 **v**，顺便说一句，这在任意维数下都成立）并排排列而成的，于是我们得到：

<math class="block">
    <mi>𝗔</mi>
    <mo>=</mo>
    <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd><msub><mi>u</mi><mi>x</mi></msub></mtd>
                <mtd><msub><mi>v</mi><mi>x</mi></msub></mtd>
            </mtr>
            <mtr>
                <mtd><msub><mi>u</mi><mi>y</mi></msub></mtd>
                <mtd><msub><mi>v</mi><mi>y</mi></msub></mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
</math>

<div style="display: flex; align-items: center" markdown>
<div class="cpt" style="width:128px;" markdown>
<img src="./img/affine/metr_tex.png" id="fig:metroid_texture">  

**{*@fig:metroid_texture}a**：一张纹理。
</div>

<span style="font-size: 3em; display: inline-flex; flex-direction: column; padding: 10px">
A <br>
→

</span>

<div class="cpt" style="width:128px;" markdown>
<img src="./img/affine/metr_texmapA.png" id="fig:metroid_texture">  

**{*@fig:metroid_texture}b**：一张被映射的纹理
</div>
</div>

通过仿射矩阵 **A** 进行的一次正向纹理映射。

### 仿射变换

用 2D 矩阵所能完成的变换被称为 <dfn>[仿射](https://en.wikipedia.org/wiki/Affine_geometry)</dfn> 变换。仿射变换的技术性定义是“保持平行线不变”的变换，这基本上意味着你可以把它们写成矩阵变换的形式，或者说，一个矩形在仿射变换下会变成一个平行四边形（参见 {@fig:metroid_texture}b）。

仿射变换包含旋转和缩放，但<strong>也</strong>包含切变。这正是我反对“Rot/Scale”这个名字的原因：那个词只指代了一种特殊情况，而非一般的变换。这就好比把颜色都叫做“红色系”：没错，红色当然也是颜色，但并非所有颜色都是红色，而把它们都叫做红色，只会让人对这个主题产生扭曲的认识。

正如我所说，基本的 2D 变换有三种，不过你总是可以用其中两种来描述第三种。这些变换分别是：旋转（**R**）、缩放（**S**）和切变（**H**）。{*@tbl:transformation_matrices_and_their_inverses} 展示了每种变换作用于常规 metroid 精灵时的效果。黑色坐标轴是普通的基向量（注意 *y* 是向下的！），蓝色坐标轴是变换后的基向量，青色变量则是变换的参数。同时给出的还有每种变换的矩阵及其逆矩阵。为什么？你很快就会明白。

  
<math id="eq:transformation_matrix_and_inverse" class="block">
    <mo>(</mo>
    <mi>{!@eq:transformation_matrix_and_inverse}</mi>
    <mo>)</mo>
    <mspace width="30px" />
    <mi>𝗔</mi>
    <mo>=</mo>
    <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd><mi>a</mi></mtd>
                <mtd><mi>b</mi></mtd>
            </mtr>
            <mtr>
                <mtd><mi>c</mi></mtd>
                <mtd><mi>d</mi></mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
    <mspace width="30px"/>
    <msup>
        <mi>𝗔</mi>
        <mn>-1</mn>
    </msup>
    <mo>≡</mo>
    <mfrac>
        <mn>1</mn>
        <mrow>
            <mi>a</mi><mi>d</mi><mo>-</mo><mi>b</mi><mi>c</mi>
        <mrow>
    </mfrac>
        <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd><mi>d</mi></mtd>
                <mtd><mo>-</mo><mi>b</mi></mtd>
            </mtr>
            <mtr>
                <mtd><mo>-</mo><mi>c</mi></mtd>
                <mtd><mi>a</mi></mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
</math>

{*@tbl:transformation_matrices_and_their_inverses}：变换矩阵及其逆矩阵。
<table id="tbl:transformation_matrices_and_their_inverses" class="table-data">
    <thead>
        <tr>
            <th>单位矩阵</th>
            <th>旋转</th>
            <th>缩放</th>
            <th>切变</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td markdown><img alt="Normal metroid" src="img/affine/metr_id.png" /></td>
            <td markdown><img alt="Rotated metroid" src="img/affine/metr_rot.png" /></td>
            <td markdown><img alt="Scaled metroid" src="img/affine/metr_scale.png" /></td>
            <td markdown><img alt="Sheared metroid" src="img/affine/metr_shear.png" /></td>
        </tr>
        <tr>
            <td>
                <math>
                    <mi>𝗜</mi>
                    <mo>=</mo>
                    <mrow>
                        <mo>[</mo>
                        <mtable>
                            <mtr>
                                <mtd><mn>1</mn></mtd>
                                <mtd><mn>0</mn></mtd>
                            </mtr>
                            <mtr>
                                <mtd><mn>0</mn></mtd>
                                <mtd><mn>1</mn></mtd>
                            </mtr>
                        </mtable>
                        <mo>]</mo>
                    </mrow>
                </math>
            </td>
            <td>
                <math>
                    <mi>𝗥</mi>
                    <mo>(</mo>
                    <mn>&theta;</mn>
                    <mo>)</mo>
                    <mo>=</mo>
                    <mrow>
                        <mo>[</mo>
                        <mtable>
                            <mtr>
                                <mtd><mi>cos</mi><mo>(</mo><mn>&theta;</mn><mo>)</mo></mtd>
                                <mtd><mo>-</mo><mi>sin</mi><mo>(</mo><mn>&theta;</mn><mo>)</mo></mtd>
                            </mtr>
                            <mtr>
                                <mtd><mi>sin</mi><mo>(</mo><mn>&theta;</mn><mo>)</mo></mtd>
                                <mtd><mi>cos</mi><mo>(</mo><mn>&theta;</mn><mo>)</mo></mtd>
                            </mtr>
                        </mtable>
                        <mo>]</mo>
                    </mrow>
                </math>
            </td>
            <td>
                <math>
                    <mi>𝗦</mi>
                    <mo>(</mo>
                    <msub><mi>s</mi><mi>x</mi></msub>
                    <mo>,</mo>
                    <msub><mi>s</mi><mi>y</mi></msub>
                    <mo>)</mo>
                    <mo>=</mo>
                    <mrow>
                        <mo>[</mo>
                        <mtable>
                            <mtr>
                                <mtd><msub><mi>s</mi><mi>x</mi></msub></mtd>
                                <mtd><mn>0</mn></mtd>
                            </mtr>
                            <mtr>
                                <mtd><mn>0</mn></mtd>
                                <mtd><msub><mi>s</mi><mi>y</mi></msub></mtd>
                            </mtr>
                        </mtable>
                        <mo>]</mo>
                    </mrow>
                </math>
            </td>
            <td>
                <math>
                    <mi>𝗛</mi>
                    <mo>(</mo>
                    <msub><mi>h</mi><mi>x</mi></msub>
                    <mo>,</mo>
                    <msub><mi>h</mi><mi>y</mi></msub>
                    <mo>)</mo>
                    <mo>=</mo>
                    <mrow>
                        <mo>[</mo>
                        <mtable>
                            <mtr>
                                <mtd><mn>1</mn></mtd>
                                <mtd><msub><mi>h</mi><mi>x</mi></msub></mtd>
                            </mtr>
                            <mtr>
                                <mtd><msub><mi>h</mi><mi>y</mi></msub></mtd>
                                <mtd><mn>1</mn></mtd>
                            </mtr>
                        </mtable>
                        <mo>]</mo>
                    </mrow>
                </math>
            </td>
        </tr>
        <tr>
            <td>
                <math>
                    <msup><mi>𝗜</mi><mn>-1</mn></msup>
                    <mo>=</mo>
                    <mi>𝗜</mi>
                </math>
            </td>
            <td>
                <math>
                    <msup><mi>𝗥</mi><mn>-1</mn></msup><mo>(</mo><mn>&theta;</mn><mo>)</mo>
                    <mo>=</mo>
                    <mi>𝗥</mi><mo>(</mo><mn>-&theta;</mn><mo>)</mo>
                </math>
            </td>
            <td>
                <math>
                    <msup><mi>𝗦</mi><mn>-1</mn></msup>
                    <mo>(</mo>
                    <msub><mi>s</mi><mi>x</mi></msub>
                    <mo>,</mo>
                    <msub><mi>s</mi><mi>y</mi></msub>
                    <mo>)</mo>
                    <mo>=</mo>
                    <mi>𝗦</mi>
                    <mo>(</mo>
                    <mfrac><mn>1</mn><msub><mi>s</mi><mi>x</mi></msub></mfrac>
                    <mo>,</mo>
                    <mfrac><mn>1</mn><msub><mi>s</mi><mi>y</mi></msub></mfrac>
                    <mo>)</mo>
                </math>
            </td>
            <td>
                <math>
                    <msup><mi>𝗛</mi><mn>-1</mn></msup>
                    <mo>(</mo>
                    <msub><mi>h</mi><mi>x</mi></msub>
                    <mo>,</mo>
                    <msub><mi>h</mi><mi>y</mi></msub>
                    <mo>)</mo>
                    <mo>=</mo>
                    <mfrac>
                        <mrow>
                            <mi>𝗛</mi>
                            <mo>(</mo>
                            <mn>-</mn><msub><mi>h</mi><mi>x</mi></msub>
                            <mo>,</mo>
                            <mn>-</mn><msub><mi>h</mi><mi>y</mi></msub>
                            <mo>)</mo>
                        </mrow>
                        <mrow>
                            <mn>1</mn>
                            <mo>-</mo>
                            <msub><mi>h</mi><mi>x</mi></msub>
                            <msub><mi>h</mi><mi>y</mi></msub>
                        </mrow>
                    </mfrac>
                </math>
            </td>
        </tr>
    </tbody>
</table>

现在我们可以借助这些定义，通过矩阵乘法求出在 <math><msub><mi>s</mi><mi>x</mi></msub></math> 和 <math><msub><mi>s</mi><mi>y</mi></msub></math> 方向上的放大，再接一个**逆时针**旋转 α（= −θ）的正确矩阵。

<math id="eq:inverse_transform" class="block">
    <mo>(</mo>
    <mi>{!@eq:inverse_transform}</mi>
    <mo>)</mo>
    <mspace width="30px" />
    <mi>𝗔</mi>
    <mo>=</mo>
    <mi>𝗥</mi><mo>(</mo><mn>-&alpha;</mn><mo>)</mo>
    <mo>&middot;</mo>
    <mi>𝗦</mi><mo>(</mo><msub><mi>s</mi><mi>x</mi></msub><mo>,</mo><msub><mi>s</mi><mi>y</mi></msub><mo>)</mo>
    <mo>=</mo>
    <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd><msub><mi>s</mi><mi>x</mi></msub><mi>cos</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
                <mtd><msub><mi>s</mi><mi>y</mi></msub><mi>sin</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
            </mtr>
            <mtr>
                <mtd><mo>-</mo><msub><mi>s</mi><mi>x</mi></msub><mi>sin</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
                <mtd><msub><mi>s</mi><mi>y</mi></msub><mi>cos</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
</math>

…呃，等等……我有一种似曾相识的奇怪感觉……

:::note 顺时针 vs 逆时针

这是个小问题，但我必须提一下。如果 **R** 的定义是使用顺时针旋转，为什么我突然改用逆时针了呢？嗯，传统上 **R** 就是被给定为那个特定的矩阵，其中角度从 x 轴指向 y 轴。由于 *y* 是向下的，这等价于顺时针。然而，BIOS 中的仿射例程使用的是逆时针旋转，而我觉得以它作为我自己函数的准绳是个好主意。

:::

:::note 命名法：仿射 vs 旋转/缩放

矩阵 **P** 既不是旋转矩阵，也不是缩放矩阵，而是一个通用的仿射变换矩阵。旋转和缩放或许是这个矩阵最常用的用途，但这并不意味着它们就是唯一可能的事，而“Rot/Scale”这个词所暗示的恰恰就是“唯一可能”。

为了把它们与常规背景和精灵区分开来，我觉得“Rotation”或“Rot/Scale”也够用了，只是不完全准确。不过，把 **P** 矩阵叫做那些名字，根本就是错误的。

:::

## “我们坚持的许多真理，很大程度上取决于我们自己的视角。”

<div class="cpt_fr" style="width:160px">

<img src="./img/affine/metr_texmapA.png" id="fig:human_pov">  

**{*@fig:human_pov}**：从人类视角看到的映射过程。**u** 和 **v** 是 **A** 的各列（在屏幕空间中）。

</div>

正如你一定已经注意到的那样，{@eq:inverse_transform} 与 {@eq:incorrect_transform_matrix} 完全相同，而我之前说它是错的。那么这是怎么回事？嗯，如果你把这个矩阵填入 `pa-pd` 这些元素里，你确实会得到与你预期不同的东西。只不过现在，我已经从一开始就证明了你原本应该预期的是什么（即先按 <math><msub><mi>s</mi><mi>x</mi></msub></math> 和 <math><msub><mi>s</mi><mi>y</mi></msub></math> 缩放，再逆时针旋转 α）。真正的问题当然是：为什么这不起作用？为了回答这个问题，我将给出两种不同的看待 2D 映射过程的方式。

### 人类视角

“你好，我是 Cearn 的大脑。我懂几何，能在脑子里做矩阵变换。呃，其实是他的脑子。说到纹理映射，我看到原始的图（在纹理空间中），然后想象出变换。我看着原始图，看着图的像素最终落在屏幕的什么位置。这个变换的矩阵是 **A**，它通过 **q** = **A · p** 把纹素 **p** 与屏幕像素 **q** 联系起来。**A** 的各列就是变换后的单位矩阵。简单得就像 π。”

### 计算机视角

<div class="cpt_fr" style="width:160px">

<img src="./img/affine/metr_texmapB.png" id="fig:comp_pov">  

**{*@fig:comp_pov}**：从计算机视角看到的映射过程。**u** 和 **v**（在纹理空间中）是 **B** 的各列，被映射到屏幕空间中的主轴。

</div>

“你好，我是 Cearn 的 GBA。我是一台精悍的掌上游戏机，能以无人能及的方式推送像素。也许除了他主人的那块 GeForce 4 Ti4200，那个爱显摆的家伙。总之，我做的事情之一就是纹理映射。而且不只是普通的纹理映射，我还能玩旋转和缩放之类的酷炫花样。我所做的不过是填充像素，我只需要你告诉我该从哪儿取像素的颜色。换句话说，为了填充屏幕像素 **q**，我需要一个矩阵 **B**，它通过 **p = B · q** 给我对应的纹素 **p**。你给我什么矩阵我都乐意用；我完全相信你有能力提供你所需变换的矩阵。”

### 解析

我希望你已经发现了这两种视角之间的关键差异。**A** 的映射方向是从纹理空间<strong>到</strong>屏幕空间，而 **B** 恰好相反（即 <math><mi>𝗕</mi><mo>=</mo><msup><mi>𝗔</mi><mn>-1</mn></msup></math>）。我想你现在应该知道该把哪一个交给 GBA 了。没错：**P = B**，而不是 **A**。这一条信息，就是仿射矩阵谜题中最关键的一块拼图。

所以现在你可以用两种方式求出 **P** 的元素。你可以坚守人类视角，最后再对矩阵求逆。这正是我之前把仿射变换的逆矩阵也一并交给你的原因。你也可以试着用 GBA 的方式去思考，从而直接得到正确的矩阵。Tonc 的主要仿射函数（<i>tonc_video.h</i>、<i>tonc_obj_affine.c</i> 和 <i>tonc_bg_affine.c</i>）都采用 GBA 的方式，直接设置 **P**；不过也提供了使用 “`_inv`” 后缀的逆变换函数。请注意，这些会稍微慢一些。除非涉及缩放，那样就会慢<strong>很多</strong>。

如果你好奇的话，先做按 (<math><msub><mi>s</mi><mi>x</mi></msub></math>, <math><msub><mi>s</mi><mi>y</mi></msub></math>) 缩放、再逆时针旋转 α 的正确矩阵是：

<math class="block">
    <mi>𝗔</mi>
    <mo>=</mo>
    <mi>𝗥</mi><mo>(</mo><mn>-&alpha;</mn><mo>)</mo>
    <mo>&middot;</mo>
    <mi>𝗦</mi><mo>(</mo><msub><mi>s</mi><mi>x</mi></msub><mo>,</mo><msub><mi>s</mi><mi>y</mi></msub><mo>)</mo>
</math>

<math class="block">
    <mtable>
        <mtr>
            <mtd>
                <mi>𝗣</mi>
            </mtd>
            <mtd columnalign="left">
                <mo>=</mo>
                <msup><mi>𝗔</mi><mn>-1</mn></msup>
            </mtd>
        </mtr>
        <mtr>
            <mtd />
            <mtd columnalign="left">
                <mo>=</mo>
                <mo>(</mo>
                <mi>𝗥</mi><mo>(</mo><mn>-&alpha;</mn><mo>)</mo>
                <mo>&middot;</mo>
                <mi>𝗦</mi><mo>(</mo><msub><mi>s</mi><mi>x</mi></msub><mo>,</mo><msub><mi>s</mi><mi>y</mi></msub><mo>)</mo>
                <msup><mo>)</mo><mn>-1</mn></msup>
            </mtd>
        </mtr>
        <mtr>
            <mtd />
            <mtd columnalign="left">
                <mo>=</mo>
                <msup><mi>𝗦</mi><mn>-1</mn></msup><mo>(</mo><msub><mi>s</mi><mi>x</mi></msub><mo>,</mo><msub><mi>s</mi><mi>y</mi></msub><mo>)</mo>
                <mo>&middot;</mo>
                <msup><mi>𝗥</mi><mn>-1</mn></msup><mo>(</mo><mn>-&alpha;</mn><mo>)</mo>
            </mtd>
        </mtr>
    </mtable>
</math>

使用前面给出的逆矩阵，我们得到

<math id="eq:correct_matrix" class="block">
    <mo>(</mo>
    <mi>{!@eq:correct_matrix}</mi>
    <mo>)</mo>
    <mspace width="30px" />
    <mi>𝗣</mi>
    <mo>=</mo>
    <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd><msub><mi>p</mi><mi>a</mi></msub></mtd>
                <mtd><msub><mi>p</mi><mi>b</mi></msub></mtd>
            </mtr>
            <mtr>
                <mtd><msub><mi>p</mi><mi>c</mi></msub></mtd>
                <mtd><msub><mi>p</mi><mi>d</mi></msub></mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
    <mo>=</mo>
    <mrow>
        <mo>[</mo>
        <mtable>
            <mtr>
                <mtd>
                    <mfrac>
                        <mrow><mi>cos</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mrow>
                        <msub><mi>s</mi><mi>x</mi></msub>
                    </mfrac>
                </mtd>
                <mtd>
                    <mfrac>
                        <mrow><mn>-</mn><mi>sin</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mrow>
                        <msub><mi>s</mi><mi>x</mi></msub>
                    </mfrac>
                </mtd>
            </mtr>
            <mtr>
                <mtd>
                    <mfrac>
                        <mrow><mi>sin</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mrow>
                        <msub><mi>s</mi><mi>y</mi></msub>
                    </mfrac>
                </mtd>
                <mtd>
                    <mfrac>
                        <mrow><mi>cos</mi><mo>(</mo><mn>&alpha;</mn><mo>)</mo></mrow>
                        <msub><mi>s</mi><mi>y</mi></msub>
                    </mfrac>
                </mtd>
            </mtr>
        </mtable>
        <mo>]</mo>
    </mrow>
</math>

<div class="note" markdown>
只是为了把它讲得清清楚楚：

仿射矩阵 **P** 的映射方向是从屏幕空间<strong>到</strong>纹理空间，而不是相反！

换句话说：

&nbsp;<math><msub><mi>p</mi><mi>a</mi></msub></math>：纹理 *x* 方向每像素的增量

&nbsp;<math><msub><mi>p</mi><mi>b</mi></msub></math>：纹理 *x* 方向每扫描线的增量

&nbsp;<math><msub><mi>p</mi><mi>c</mi></msub></math>：纹理 *y* 方向每像素的增量

&nbsp;<math><msub><mi>p</mi><mi>d</mi></msub></math>：纹理 *y* 方向每扫描线的增量
</div>

## 收尾工作 {#sec-finish}

知道 **P** 矩阵是用来做什么的是一回事，知道如何正确地使用它们是另一回事。在你着手处理仿射对象/背景和仿射矩阵时，还有三个要点需要记住：

1.  数据类型
2.  查找表
3.  初始化

### 仿射元素的数据类型

仿射变换属于数学范畴，一般来说，数学上的数都是实数，也就是浮点数。然而，如果你用浮点数来表示 **P** 的元素，你会遭遇两个令人不快的意外。

第一个意外是：矩阵元素并不是浮点数，而是整数。其背后的原因在于<span class="ack">GBA 没有浮点运算单元（FPU）！</span>所有的浮点运算都必须在软件中完成，而没有 FPU 的话，这会相当慢——无论如何都比整数运算慢得多。现在，当你细想这件事时，它确实会在精度和诸如此类的方面带来一些问题。例如，(正)余弦函数的取值范围在 −1 到 1 之间，当用整数来表示时，这个范围可不算大。不过，如果人们不是以 1 为单位来计数，而是以分数（比如说以 1/256 为单位）来计数，这个范围就会大得多。这样，\[−1, +1\] 的取值范围就变成了 \[−256, +256\]。

这种用缩放后的整数来表示实数的策略被称为<dfn>定点数运算</dfn>，你可以在[这个附录](fixed.html)以及 [wikipedia](https://en.wikipedia.org/wiki/Fixed-point_arithmetic) 上读到更多相关内容。GBA 把定点数用于它的仿射参数，但你也可以把它用在别的地方。**P** 矩阵的元素是 8.8 格式的定点数，意味着一个半字（halfword）中有 8 个整数位和 8 个小数位。要把一个矩阵设为单位矩阵（对角线上是 1，其余位置是 0），你不应该这样写：

```c
    // Floating point == Bad!!
    pa= pd= 1.0;
    pb= pc= 0.0;
```

而应该这样写：

```c
    // .8 Fixed-point == Good
    pa= pd= 1<<8;
    pb= pc= 0;
```

在具有 *Q* 个小数位的定点数系统中，“1”（“一”）由 <math><msup><mn>2</mn><mi>Q</mi></msup></math> 或 1<<*Q* 表示，因为这正是分数运作的方式。

现在，定点数说到底仍然只是整数，但整数也有不同的类型，使用正确的类型很重要。8.8f 是 16 位的变量，所以逻辑上的选择是 `short`。不过，它应该是一个<strong>有符号</strong>的 short：`s16`，而不是 `u16`。有时候这没关系，但如果你要对它们做任何算术运算，它们最好是有符号的。请记住，CPU 内部是以字（word，32 位）为单位工作的，16 位变量会被转换成字。你当然希望，比如说，一个 16 位的 “−1”（`0xFFFF`）能变成 32 位的 “−1”（`0xFFFFFFFF`），而不是 “65535”（`0x0000FFFF`），而后者正是使用无符号 short 时会发生的情况。此外，在做定点数运算时，建议使用有符号的 int（32 位那种），用别的什么都会拖慢你，而且还可能遇到溢出问题。

  

:::tip 用 32 位有符号 int 作为仿射临时变量

当然，无论如何你都应该把 32 位变量用于所有场合（除非你真的<em>想</em>让代码膨胀并变慢）。如果你使用 16 位变量（`short` 或 `s16`），不仅因为要加上额外的指令来维持变量的 16 位特性而导致代码变慢，而且会更快遭遇溢出问题。

只有在最终写入硬件的那一步，你才应该转换成 8.8 格式。在那之前，为了速度和精度，请使用更大的类型。

:::

### 查找表(LUT) {#sec-luts}

所以，使用定点数运算是因为浮点运算对于高效运用来说实在太慢了。对于你自己的数学运算来说，这没什么问题，但像 sin() 和 cos() 这样的数学函数该怎么办呢？它们在内部仍然是浮点的（更糟的是，是 *`double`s*！），所以那些函数会慢得离谱。

与其直接使用这些函数，我们不妨采用一个历史悠久的传统来逃避使用昂贵的数学函数：我们将构建一个<dfn>查找表</dfn>（LUT），里面装有正弦和余弦值。这有若干种做法。如果你想要一个省事的策略，你可以直接声明两个各含 360 个 8.8f 数的数组，并在程序初始化时把它们填满。不过，这是一种糟糕的做法，原因在附录的[查找表章节](fixed.html#sec-lut)里有解释。

Tonclib 有一个单一的正弦查找表，它可以同时用于正弦和余弦值。这个查找表叫做 `sin_lut`，是一个由 512 个 4.12f 条目（12 个小数位）组成的 `const short` 数组，由我的 [excellut](http://www.coranac.com/projects/#excellut) 查找表生成器创建。在 <i>tonc_math.h</i> 中，你可以找到两个用于取回正弦和余弦值的 inline 函数：

```c
//! Look-up a sine and cosine values
/*! \param theta Angle in [0,FFFFh] range
*   \return .12f sine value
*/

INLINE s32 lu_sin(uint theta)
{   return sin_lut[(theta>>7)&0x1FF];           }

INLINE s32 lu_cos(uint theta)
{   return sin_lut[((theta>>7)+128)&0x1FF];     }
```

现在，请注意角度的范围：0–10000h。请记住，你并不<em>必须</em>用 360 度来代表一个圆；事实上，在计算机上，把一个圆分成 2 的幂次方会更好。在这个例子中，角度使用的是 2<sup>16</sup> 等分（为了与 BIOS 函数兼容），在查找函数内部再缩减为 512 的范围。

### 初始化

当你把一个背景或对象标记为仿射时，你<strong>必须</strong>至少向 `pa-pd` 中填入一些值。请记住，默认情况下它们都是零。零偏移意味着整个东西都会使用第一个像素。如果你得到一个纯色的背景或精灵，原因大概就在这里。为了避免这种情况，请把 **P** 设为单位矩阵或任何其它非零矩阵。

## Tonc 的仿射函数

Tonclib 中包含若干用于操纵对象和背景的仿射参数的函数，它们通过 `OBJ_AFFINE` 和 `BG_AFFINE` 结构体来使用。由于仿射矩阵在两种结构体中的存储方式不同，你无法用同一个函数来设置它们，但它们的功能是一样的。在 {@tbl:affine_functions} 中你可以找到基本的格式和描述；只需把 *foo* 替换成 `obj_aff` 或 `bg_aff`，把 *FOO* 替换成 `OBJ` 或 `BG`，就分别对应对象和背景。这些函数本身，针对对象的可以在 <i>tonc_obj_affine.c</i> 中找到，针对背景的在 <i>tonc_bg_affine.c</i> 中，而两者的 inline 版本则都在 `tonc_video.h` 里的某处。

<table class="cblock table-data" id="tbl:affine_functions">
    <thead>
        <tr>
            <th>函数</th>
            <th>描述</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>void <i>foo</i>_copy(FOO_AFFINE *dst, const FOO_AFFINE *src, uint count);</td>
            <td>复制仿射参数</td>
        </tr>
        <tr>
            <td>void <i>foo</i>_identity(FOO_AFFINE *oaff);</td>
            <td><math><mi>P</mi><mo>=</mo><mi>I</mi></td>
        </tr>
        <tr>
            <td>void <i>foo</i>_postmul(FOO_AFFINE *dst, const FOO_AFFINE *src);</td>
            <td>后乘：<math><mi>D</mi><mo>=</mo><mi>D</mi><mo>&middot;</mo><mi>S</mi></math></td>
        </tr>
        <tr>
            <td>void <i>foo</i>_premul(FOO_AFFINE *dst, const FOO_AFFINE *src);</td>
            <td>前乘：<math><mi>D</mi><mo>=</mo><mi>S</mi><mo>&middot;</mo><mi>D</mi></math></td>
        </tr>
        <tr>
            <td>void <i>foo</i>_rotate(FOO_AFFINE *aff, u16 alpha);</td>
            <td>逆时针旋转 α·π/8000h。</td>
        </tr>
        <tr>
            <td>void <i>foo</i>_rotscale(FOO_AFFINE *aff, FIXED sx, FIXED sy, u16 alpha);</td>
            <td>按 <math><mfrac><mn>1</mn><msub><mi>s</mi><mi>x</mi></msub></mfrac></math> 和 <math><mfrac><mn>1</mn><msub><mi>s</mi><mi>y</mi></msub></mfrac></math> 缩放，再逆时针旋转 α·π/8000h。</td>
        </tr>
        <tr>
            <td>void <i>foo</i>_rotscale2(FOO_AFFINE *aff, const AFF_SRC *as);</td>
            <td>与 <code><i>foo</i>_rotscale()</code> 相同，但输入存放在一个 <code>AFF_SRC</code> 结构体中。</td>
        </tr>
        <tr>
            <td>void <i>foo</i>_scale(FOO_AFFINE *aff, FIXED sx, FIXED sy);</td>
            <td>按 <math><mfrac><mn>1</mn><msub><mi>s</mi><mi>x</mi></msub></mfrac></math> 和 <math><mfrac><mn>1</mn><msub><mi>s</mi><mi>y</mi></msub></mfrac></math> 缩放</td>
        </tr>
        <tr>
            <td>void <i>foo</i>_set(FOO_AFFINE *aff, FIXED pa, FIXED pb, FIXED pc, FIXED pd);</td>
            <td>设置 P 的元素</td>
        </tr>
        <tr>
            <td>void <i>foo</i>_shearx(FOO_AFFINE *aff, FIXED hx);</td>
            <td>将顶边向右切变 <math><msub><mi>h</mi><mi>x</mi></msub></math></td>
        </tr>
        <tr>
            <td>void <i>foo</i>_sheary(FOO_AFFINE *aff, FIXED hy);</td>
            <td>将左边向下切变 <math><msub><mi>h</mi><mi>y</mi></msub></math></td>
        </tr>
    </tbody>
</table>
**{*@tbl:affine_functions}**：仿射函数

### 旋转/缩放示例函数

下面给出的是我写的、对象版本的“先缩放再旋转”函数（仿 {@eq:correct_matrix}）。请注意，它是从计算机视角出发的，因此 `sx` 和 `sy` 是缩小。另外，角度 `alpha` 用的是 10000h/圈（即 α 的单位是 π/8000h = 0.096 毫弧度，或 180/8000h = 0.0055°），而正弦查找表是 .12f 格式，这正是为什么需要那些向右移 12 位的操作。背景版本与之完全相同，除了名字和类型不同。如果这是 C++，模板在这里会非常有用。

```c
void obj_aff_rotscale(OBJ_AFFINE *oaff, int sx, int sy, u16 alpha)
{
    int ss= lu_sin(alpha), cc= lu_cos(alpha);

    oaff->pa= cc*sx>>12;    oaff->pb=-ss*sx>>12;
    oaff->pc= ss*sy>>12;    oaff->pd= cc*sy>>12;
}
```

有了本章所讲的内容，你就知道了关于仿射矩阵的大部分所需知识，首先是为什么它们应该被称为<em>仿射</em>矩阵，而不是仅仅叫旋转、或是 rot/scale，或是你在别处可能见到的其它名字。你现在应该知道这东西到底做了什么，以及如何为你想要的效果搭建一个矩阵。你也应当对定点数和查找表有了一些了解（更多内容请看[附录](fixed.html)），以及为什么它们是好东西；如果之前还不明确的话，你现在应该意识到，你所使用的数据类型的选择其实<em>很重要</em>，而不该随手抓一个就用。

这里还没有讨论的是，你究竟该如何搭建对象和背景来使用仿射变换，而这正是接下来两章的内容。关于仿射变换的更多内容，可以尝试搜索“线性代数”。
