# A. 数字、位与位操作

<!-- toc -->

## 数字 {#sec-num}

### 符号的真正含义 {#ssec-num-intro}

> “这个世界上有 10 种人：懂二进制的人，和不懂二进制的人。”

如果你没听懂这个笑话，那你属于后者。和所有人一样，你小时候大概学过，数字‘1’和‘0’的组合表示十。其实不然——并不完全如此。这里的关键问题在于符号的含义。接下来我要告诉你的，是理解外界那些令人困惑之事的钥匙，所以凑过来，听我说说它们到底意味着什么。听好了？那好，开始吧。你日常最基本的符号，像‘1’、‘0’之类，其本身**毫无意义**（SQUAT）！

没错：毫无意义、空无一物、零、zip、nada、noppes、dick，以及你能想到的所有表示“什么都没有”的同义词。符号本身并不承载含义；含义是*我们人类强加*于其上的。符号是交流的手段。世界上有很多东西——物体、人、情感、动作——我们用符号给它们贴标签以便区分。符号本身没有任何含义；它们只是<dfn>表征</dfn>（representations），是我们按照自己方便的方式臆造出来的标签。遗憾的是，这一点在你成长过程中很少有人提及，别人只告诉你哪个符号对应哪个概念，这容易让人把事物本身和它的表征混为一谈。确实有人这么做，但他们仍意识到符号只是社会建构，并进而开始相信符号所代表的东西（比如重力和 π 这样的数）也仅仅是社会建构。（不过这些人却不肯用从 22 楼窗外跳出去之类的方式来证明这一点。）

举一个简单的符号例子：词语“chair”（椅子）。这个词本身与“供一人就坐、有靠背、通常有四条腿的家具”（韦氏词典）没有任何内在联系；只是有个词指代这种物体很方便，这样我们在交谈时才知道彼此在说什么。显然，这只有在对话各方对同一种物体使用同一个词时才有效，所以过去某个时候，几个人聚在一起约定了一套词，称之为英语。既然词语只是没有内在含义的符号，不同群体*可以*也确实创造了不同的词集。

人们为了方便达成的这种约定，称为<dfn>约定</dfn>（convention，基本上就是“标准”的华丽说法）。约定无处不在。这也正是问题的一部分：它们太普遍了，以至于常被想当然。到某个时候，某项约定变得如此正常，以至于人们忘记了它最初只是为了方便交流而达成的协议，并给约定所指之物附加上了真实含义：约定于是变成了“传统”。

回到数字。数字用于两件事：计量与标识（分别对应基数词和序数词）。我们在这里主要关心计量：一根香蕉、两根香蕉、三根香蕉，诸如此类。数字被写下来的方式——用符号表征——仅仅是一种约定；对大多数人来说，它甚至可能是一种传统。表示数字有几种不同的方式：用文字（一、二、三、四、五）、用刻痕（*I, II, III, IIII, ~~IIII~~*）、用罗马数字（I, II, III, IV, V）。这些你都在某个时候见过。不过最常用的系统，是所谓的<dfn>基-*N* 进位制</dfn>（base-*N* positional system）的一个变体。

### 基-*N* 进位制 {#ssec-num-basen}

“那么，Mike，什么是基-n 进位制？”嗯，当你要写很长的数字和/或做四则运算时，它大概是最方便的系统了！基本思想是：你手头有 *N* 个符号——数字——从 0 到 *N*−1，并用*一串* *m* 个数字来表示每一个可能的数。字符串中位置 *i* 上的数字 *a*<sub>i</sub>，是基数的第 *i* 次幂的一个乘数。完整的数 *S*，就是各次幂 *N*<sup>i</sup> 与其乘数 *a*<sub>i</sub> 乘积的总和。

<!--
S={\Sigma}a_iN^i
-->
<table id="eq:sum-aini">
<tr>
  <td class="eqnrcell">({!@eq:sum-aini})
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>S</mi>
            <mo>=</mo>
            <mrow data-mjx-texclass="ORD">
              <mi mathvariant="normal">&#x3A3;</mi>
            </mrow>
            <msub>
              <mi>a</mi>
              <mi>i</mi>
            </msub>
            <msup>
              <mi>N</mi>
              <mi>i</mi>
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

理解这个系统的另一种方式，是把这些数看作一组计数器，就像汽车和老式磁带机里那种老式里程表。这里你有若干个带 *N* 个数字的转轮。每个转轮都设置成在转满一圈后使前面的计数器加一。你从全零开始，然后开始转动最后一个转轮。经过 *N* 个数之后，它转满一圈：这个计数器回到零，旁边的那个加一。再经过 *N* 个数又如此，经过 *N*<sup>2</sup> 后第二个计数器也满了，于是第三个计数器加一，依此类推，等等。

下面以大家熟悉的 *N* 等于十的情况为例：十进制。基十意味着有十个不同的符号（数字）：0, 1, 2, 3, 4, 5, 6, 7, 8, 9。注意这些符号的形式是任意的，不过这是我们几个世纪前从阿拉伯人那里得到/偷来的。还要注意零符号。零是数学中最重要的发现之一，它使进位制成为可能。现在，对于我们这个示例数字串，考虑“1025”，应读作：

<div class="lblock">
<table>
<tr><td>1025<sub>ten</sub>
  <td>=<td> 1·10<sup>3</sup><sub>ten</sub>
  <td>+<td> 0·10<sup>2</sup><sub>ten</sub>
  <td>+<td> 2·10<sup>1</sup><sub>ten</sub>
  <td>+<td> 5·10<sup>0</sup><sub>ten</sub>
<tr><td>
  <td>=<td> 1·1000<sub>ten</sub>
  <td>+<td> 0·100<sub>ten</sub>
  <td>+<td> 2·10<sub>ten</sub>
  <td>+<td>5·1
<tr><td><td>=<td colspan=7> 一千零二十五（one thousand twenty five）
</table>
</div>

你可能注意到我大量使用了文字来表示数字。问题在于：如果你把“基-*N*”中的那个“*N*”用其自身进制写出来，你总会写成“base-10”，因为字符串“10”*永远*表示基数。这恰恰是要点所在。为了指出你所说的是哪个“10”，我遵循惯例，在其下标写上“ten”这个词。但因为在每个数字上都加下标太麻烦，我将采用另一个约定：如果某个数字没有下标，它就是十进制数。是的，就像大家一直做的那样，只不过我特意把这条约定明确说了出来。

### base-2：二进制 {#ssec-num-bin}

你要记住的是：用 10（即十）作为基数并没有什么特别的；它完全可以是 2（二进制）、8（八进制）、16（十六进制）。说真的：在 18 世纪后期，法国人制定公制来标准化一切事物时，也曾有人提议改用十二进制（base-12），因为它的因数很多。十进制之所以流行，唯一的原因是人类有十根手指，仅此而已。

举个例子，看看二进制（base-2）系统。这个系统有点特殊，因为它是最简单的基-*N* 系统，只使用两个数字 0 和 1。它也非常适合非此即彼的选择：开/关、黑/白、高/低。这使它对计算机系统而言堪称完美，而既然我们都是程序员，你最好对二进制有所了解。

如前所述，这里你只有两个符号（BInary digiTs，或称比特，bits）：0 和 1。在十进制中，你要有十个符号才会用到数字串中的新一位：0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10。但在二进制中，表示二你就需要第二位了：0, 1, 10（二用‘10’表示）。这意味着你很快就会得到很长的字符串。例如，再来看数字 1025。要把它写成二进制，就得找出 2 的各次幂中相加等于 1025 的那些乘数。首先，当然需要 2 的各次幂本身。前 11 个次幂是：

<div class="lblock">
<table id="tbl:pot" class="table-data">
<caption align="bottom"><b>{*@tbl:pot}</b>: powers of two</caption>
<col span=3 align="right">
<tr align="center"><th>exponent<th>binary<th>decimal
<tr><td> 0 <td>1			<td>1
<tr><td> 1 <td>10			<td>2
<tr><td> 2 <td>100			<td>4
<tr><td> 3 <td>1000			<td>8

<tr><td> 4 <td>1,0000		<td>16
<tr><td> 5 <td>10,0000		<td>32
<tr><td> 6 <td>100,0000		<td>64
<tr><td> 7 <td>1000,0000	<td>128

<tr><td> 8 <td>1,0000,0000	<td>256
<tr><td> 9 <td>10,0000,0000	<td>512
<tr><td>10 <td>100,0000,0000<td>1024
</table>
</div>

如你所见，二进制数字的长度增长得非常快。对于较长的数字，往往很难一眼看出它到底有多大，所以我把它们每四个数字一组用逗号分隔开。如果你是个正经的程序员，你*需要*知道 2 的各次幂，最好记到 16。二进制的好处是，你不必太操心各次幂的乘数，因为可能性只有 0 和 1。这使得十进制↔二进制的转换相对容易。对于 1025，过程如下：

<div class="lblock">
<table>
<tr><td>1025<sub>ten</sub>
  <td>=<td> 1024 <td>+<td> 1
<tr><td>
  <td>=<td> 2<sup>10</sup> <td>+<td> 2<sup>0</sup>
<tr><td>
  <td>=<td colspan=4>100,0000,0001<sub>bin</sub>
</table>
</div>

关于二进制，有一个有趣且纯属巧合的事实：2<sup>10</sup>=1024 几乎等于 10<sup>3</sup>=1000。因此，你常会看到用 1024 的各次幂配以公制前缀来表示：kilo-（千）、mega-（兆）、giga-（吉）等。当然这种对应并不精确，但作为近似是好的。这也给了推销员一个很好的骗人角度：因为在计算机世界里 2 的幂占统治地位，一兆字节（MB）是 1.05 字节——不对，是一百万零五万字节，但你有理由也可以用传统的 1M = 一百万来表示内存大小，从而让它*看起来*比实际多了 5% 的内存。在 Windows 程序里你也常会看到这两种记法混用，几乎无法判断资源管理器说的 1.4MB 文件到底能不能塞进你的软盘。

正因如此，1999 年 IEC 开始推荐一套基于 1024 次幂的二进制前缀单位。其中包括 kibibyte（KiB，1024 字节）、mebibyte（MiB，1048576 字节）和 gibibyte（GiB，1073741824 字节）。

### base-16，十六进制 {#ssec-num-hex}

<div class="cpt_fr" style="width:160px">

**{*@tbl:count}**: counting to twenty in decimal, binary, hex and octal. Note the alternating sequences in the binary column.

<div class="cblock">
<table id="tbl:count" class="table-data rules-cols">
<col span=4 align="right">
<tr><th> dec	<th> bin	<th> hex	<th> oct
<tr><td>   0	<td>    0	<td>   0    <td>   0
<tr><td>   1	<td>    1	<td>   1    <td>   1
<tr><td>   2	<td>   10	<td>   2    <td>   2
<tr><td>   3	<td>   11	<td>   3    <td>   3
<tr><td>   4	<td>  100	<td>   4    <td>   4
<tr><td>   5	<td>  101	<td>   5    <td>   5
<tr><td>   6	<td>  110	<td>   6    <td>   6
<tr><td>   7	<td>  111	<td>   7    <td>   7
<tr><td>   8	<td> 1000	<td>   8    <td>  10
<tr><td>   9	<td> 1001	<td>   9    <td>  11
<tr><td>  10	<td> 1010	<td>   a    <td>  12
<tr><td>  11	<td> 1011	<td>   b    <td>  13
<tr><td>  12	<td> 1100	<td>   c    <td>  14
<tr><td>  13	<td> 1101	<td>   d    <td>  15
<tr><td>  14	<td> 1110	<td>   e    <td>  16
<tr><td>  15	<td> 1111	<td>   f    <td>  17
<tr><td>  16	<td>10000	<td>  10    <td>  20
<tr><td>  17	<td>10001	<td>  11    <td>  21
<tr><td>  18	<td>10010	<td>  12    <td>  22
<tr><td>  19	<td>10011	<td>  13    <td>  23
<tr><td>  20	<td>10100	<td>  14    <td>  24
</table>
</div>

</div>

单就二进制本身而言并不难，只是数字太长了！上面给出的解决方案是用逗号把它们分成每组四个。还有一个更好的解决方案，就是十六进制。

十六进制是基-16 系统的名称，也叫<dfn>hex</dfn>（十六进制）。它有一个缩写这件事本身就说明了它有多普遍。现在你应该能猜到，hex 中有 16 个符号。这带来一个小问题，因为我们只有 10 个与数字相关的符号。我们没有发明新符号，而是借用了字母表的前几个字母，于是序列变成：0, 1, 2, 3, 4, 5, 6, 7, 8, 9, a, b, c, d, e, f。Hex 比二进制更紧凑。事实上，因为 16 是 2<sup>4</sup>，你正好能把四个比特塞进一个 hex 数字，所以 hex 的长度恰好是二进制的 1/4。这也是我之前用四个一组的原因。如果你知道 2 的幂，那你自然也知道 16 的幂，不过与其把数字分解成 16 的幂，通常更简单的做法是先转成二进制，分组后再转成 hex。

<div class="lblock">
<table>
<tr><td>1025<sub>ten</sub>
  <td>=<td colspan=4>100,0000,0001<sub>bin</sub>
<tr><td>
  <td>=<td>401<sub>bin</sub>·16<sup>2</sup> <td>+<td>1·16<sup>0</sup>
<tr><td>
  <td>=<td colspan=4>401<sub>hex</sub>
</table>
</div>

一个十六进制数字常被称为<dfn>nybble</dfn>（或半字节，nibble），它与 bit 和 byte 搭配得很好。说到字节，字节传统上由 8 个比特组成，因此是两个 nybble。所以你可以用 nybble 方便地写出字节和多字节类型。我个人偏好在处理 hex 数字时总是使用偶数个 nybble，以对应整个字节，不过这只是我个人习惯。十六进制在计算机世界里如此根深蒂固，以至于它不仅有缩写，还有好几种表示某个数确实是 hex 的速记记法：C 用前缀 `0x`，在汇编里你可能会看到 `\$`，在正文中则有时用后缀 `h`。

根据你编程的底层程度，你会看到上述三种系统中的任何一种。除了十进制、二进制和十六进制，你偶尔还会碰到八进制（C 的前缀 `0`）。现在，即使你从没打算用八进制，你也可能意外用到它。如果你想用补零来对齐数字列，你实际上是在把它们转换成八进制！这又是一个会让你抓狂的阴险小 bug。

### 使用进位制 {#ssec-num-base-use}

使用基-*N* 进位制相比其他数字系统有不少优势。首先，数字不会像刻痕系统那样长得离谱；你也不必像罗马数字那样为更大的数发明新符号。比较两个数字也更容易，既可以比较字符串长度，也可以只比较第一个数字。它还与概率论有联系：每个单独的数字有 *N* 种可能性，所以长度为 *m* 的数字串有 *N<sup>m</sup>* 种可能性。

它真正大显身手的地方是算术。数字串中的各个位置是等价的，所以计算‘3+4’的步骤与‘30+40’相同。这使你能够把大计算拆成更小、更简单的计算。如果你会做单符号数字的计算，你就能做所有计算。而且，步骤本身是相同的，无论你用哪种进制。我不会演示如何在二进制或 hex 中做加法，因为那相当平凡，但我会演示乘法。下面是一个计算‘123 × 456’的例子，分别用十进制和十六进制。为方便起见，我也给出了乘法表。

<div class="cblock" id="tbl:multiply">
  <table class="table-data">
  <caption><b>{*@tbl:multiply}a</b>: decimal multiplication table</caption>
  <col span=11 align="right">
  <tr><th> x
    <th> 1 <th> 2 <th> 3 <th> 4 <th> 5
	<th> 6 <th> 7 <th> 8 <th> 9 <th>10
  <tr><th> 1
    <td> 1 <td> 2 <td> 3 <td> 4 <td> 5
	<td> 6 <td> 7 <td> 8 <td> 9 <td>10
  <tr><th> 2
    <td> 2 <td> 4 <td> 6 <td> 8 <td>10
	<td>12 <td>14 <td>16 <td>18 <td>20
  <tr><th> 3
    <td> 3 <td> 6 <td> 9 <td>12 <td>15
	<td>18 <td>21 <td>24 <td>27 <td>30
  <tr><th> 4
    <td> 4 <td> 8 <td>12 <td>16 <td>20
	<td>24 <td>28 <td>32 <td>36 <td>40
  <tr><th> 5
    <td> 5 <td>10 <td>15 <td>20 <td>25
	<td>30 <td>35 <td>40 <td>45 <td>50
  <tr><th> 6
    <td> 6 <td>12 <td>18 <td>24 <td>30
	<td>36 <td>42 <td>48 <td>54 <td>60
  <tr><th> 7
    <td> 7 <td>14 <td>21 <td>28 <td>35
	<td>42 <td>49 <td>56 <td>63 <td>70
  <tr><th> 8
    <td> 8 <td>16 <td>24 <td>32 <td>40
	<td>48 <td>56 <td>64 <td>72 <td>80
  <tr><th> 9
    <td> 9 <td>18 <td>27 <td>36 <td>45
	<td>54 <td>63 <td>72 <td>81 <td>90
  <tr><th>10
    <td> 10 <td> 20 <td> 30 <td> 40 <td> 50
	<td> 60 <td> 70 <td> 80 <td> 90 <td>100
  </table>

  <table class="table-data">
  <caption><b>{*@tbl:multiply}b</b>: hex multiplication table</caption>
  <col span=17 align="right">
  <tr><th> x
    <th> 1 <th> 2 <th> 3 <th> 4 <th> 5 <th> 6 <th> 7 <th> 8
    <th> 9 <th> A <th> B <th> C <th> D <th> E <th> F <th>10
  <tr><th> 1
    <td> 1 <td> 2 <td> 3 <td> 4 <td> 5 <td> 6 <td> 7 <td> 8
    <td> 9 <td> A <td> B <td> C <td> D <td> E <td> F <td>10
  <tr><th> 2
    <td> 2 <td> 4 <td> 6 <td> 8 <td> A <td> C <td> E <td>10
    <td>12 <td>14 <td>16 <td>18 <td>1A <td>1C <td>1E <td>20
  <tr><th> 3
    <td> 3 <td> 6 <td> 9 <td> C <td> F <td>12 <td>15 <td>18
    <td>1B <td>1E <td>21 <td>24 <td>27 <td>2A <td>2D <td>30
  <tr><th> 4
    <td> 4 <td> 8 <td> C <td>10 <td>14 <td>18 <td>1C <td>20
    <td>24 <td>28 <td>2C <td>30 <td>34 <td>38 <td>3C <td>40
  <tr><th> 5
    <td> 5 <td> A <td> F <td>14 <td>19 <td>1E <td>23 <td>28
    <td>2D <td>32 <td>37 <td>3C <td>41 <td>46 <td>4B <td>50
  <tr><th> 6
    <td> 6 <td> C <td>12 <td>18 <td>1E <td>24 <td>2A <td>30
    <td>36 <td>3C <td>42 <td>48 <td>4E <td>54 <td>5F <td>60
  <tr><th> 7
    <td> 7 <td> E <td>15 <td>1C <td>23 <td>2A <td>31 <td>38
    <td>3F <td>46 <td>4D <td>54 <td>5B <td>62 <td>69 <td>70
  <tr><th> 8
    <td> 8 <td>10 <td>18 <td>20 <td>28 <td>30 <td>38 <td>40
    <td>48 <td>50 <td>58 <td>60 <td>68 <td>70 <td>78 <td>80
  <tr><th> 9
    <td> 9 <td>12 <td>1B <td>24 <td>2D <td>36 <td>3F <td>48
    <td>51 <td>5A <td>63 <td>6C <td>75 <td>7D <td>87 <td>90
  <tr><th> A
    <td> A <td>14 <td>1E <td>28 <td>32 <td>3C <td>46 <td>50
    <td>5A <td>64 <td>6E <td>78 <td>82 <td>8C <td>96 <td>A0
  <tr><th> B
    <td> B <td>16 <td>21 <td>2C <td>37 <td>42 <td>4D <td>58
    <td>63 <td>6E <td>79 <td>84 <td>8F <td>9A <td>A5 <td>B0
  <tr><th> C
    <td> C <td>18 <td>24 <td>30 <td>3C <td>48 <td>54 <td>60
    <td>6C <td>78 <td>84 <td>90 <td>9C <td>A8 <td>B4 <td>C0
  <tr><th> D
    <td> D <td>1A <td>27 <td>34 <td>41 <td>4E <td>5B <td>68
    <td>75 <td>82 <td>8F <td>9C <td>A9 <td>B6 <td>C3 <td>D0
  <tr><th> E
    <td> E <td>1C <td>2A <td>38 <td>46 <td>54 <td>62 <td>70
    <td>7E <td>8C <td>9A <td>A8 <td>B6 <td>C4 <td>D2 <td>E0
  <tr><th> F
    <td> F <td>1E <td>2D <td>3C <td>4B <td>5A <td>69 <td>78
    <td>87 <td>96 <td>A5 <td>B4 <td>C3 <td>D2 <td>E1 <td>F0
  <tr><th>10
    <td>10 <td>20 <td>30 <td>40 <td>50 <td>60 <td>70 <td>80
    <td>90 <td>A0 <td>B0 <td>C0 <td>D0 <td>E0 <td>F0 <td>100
  </table>
</div>

<div class="cblock">
<table>
<tr>
  <td>
  <table class="table-data">
  <caption>123 &times; 456, base ten</caption>
  <col span=5 align="right">
  <tr><td>&times; <th> 100  <th>   20 <th>    3	<th> sum
  <tr><th> 400    <td>40000 <td> 8000 <td> 1200 <td> 49200
  <tr><th>  50    <td> 5000 <td> 1000 <td>  150 <td>  6150
  <tr><th>   6    <td>  600 <td>  120 <td>   18 <td>   738
  <tr><th colspan=4>Result                      <th> 56088
  </table>

  <td width=32>
  <td>
  <table class="table-data">
  <caption>123 &times; 456, base 16</caption>
  <col span=5 align="right">
  <tr><td>&times; <th> 100  <th>   20 <th>    3	<th> sum
  <tr><th> 400    <td>40000 <td> 8000 <td>  C00 <td> 48C00
  <tr><th>  50    <td> 5000 <td>  A00 <td>   F0 <td>  5AF0
  <tr><th>   6    <td>  600 <td>   c0 <td>   12 <td>   6D2
  <tr><th colspan=4>Result                      <th> 4EDC2
  </table>
</table>
</div>

在两种情况下，我遵循了完全相同的步骤：把大数拆成 *N* 的幂，在乘法表中查单个乘积并在其后补上正确数量的零，然后把它们全部加起来。你可以用计算器验证这些数字是正确的。十六进制算术并不比十进制难；它只是*看起来*更难，因为你小时候没有像对十进制那样被反复灌输。

我要指出，4EDC2<sub>sixteen</sub> 实际上是 323010<sub>ten</sub>，而不是 56088<sub>ten</sub>。它也不应该是，因为第二次乘法是*全程*在 hex 下进行的：123<sub>sixteen</sub> × 456<sub>sixteen</sub>，实际上对应的是 291<sub>ten</sub> × 1110<sub>ten</sub>。这就是为什么隐含的约定会引发麻烦：在*不同*约定下，*同一个*数字串可能意味着*完全不同*的东西。请务必牢记这一点。（顺便说一句，这类事实也驳斥了那种被称为“数字命理学”的心理病毒。当然，在它的信徒眼里并非如此，因为信仰体系的一个特征就是：随着反证越来越多，信念反而增强，而不是减弱。）

#### 看，它会浮！ {#num-float}

只有进位制才能做到的一件事，就是使用浮点数（floating point）。数字串中的每个数字都是 *N* 的某次幂的乘数，但为什么只使用正次幂呢？*x* 的负次幂是 1/*x* 的连续乘积：*x*<sup>−n</sup> = (1/*x*)<sup>n</sup>。例如，π 可以这样分解：

<div class="lblock">
<table class="table-data">
<col span=9 width=32>
<tr align="center">
  <th>exp
  <td> 3 <td> 2 <td> 1 <th> 0 <td> -1 <td> -2 <td> -3 <td> -4 <td>...
<tr align="center">
  <th>pow
  <td> 1000 <td> 100 <td> 10 <th> 1
  <td> <sup>1</sup>/<sub>10</sub>   <td> <sup>1</sup>/<sub>100</sub>
  <td> <sup>1</sup>/<sub>1000</sub> <td> <sup>1</sup>/<sub>10000</sub>
  <td> ...
<tr align="center">
  <th>&pi;
  <td> 0 <td> 0 <td> 0 <th> 3 <td> 1 <td> 4 <td> 1 <td> 6 <td> ...
</table>
</div>

你不能简单地用数字串来表示这一点；你需要知道负次幂从哪里开始。这是用一个小数点来实现的：π≈3.1416。至少，英语社区使用句点；在荷兰这里，人们用逗号。这又是一个约定不一致的例子，而且会*严重*搞乱你的电子表格。

由于每个基-*N* 系统都是等价的，你同样可以在二进制下这么做。二进制下的 π 是：

<div class="lblock">
<table class="table-data">
<col span=9 width=16>
<tr align="center">
  <th>exp
  <td> 3 <td> 2 <td> 1 <th> 0 <td> -1 <td> -2 <td> -3 <td> -4 <td> ...
<tr align="center">
  <th>pow
  <td> 8 <td> 4 <td> 2 <th> 1
  <td> <sup>1</sup>/<sub>2</sub>   <td> <sup>1</sup>/<sub>4</sub>
  <td> <sup>1</sup>/<sub>8</sub> <td> <sup>1</sup>/<sub>16</sub>
  <td> ...
<tr align="center">
  <th>&pi;
  <td> 0 <td> 0 <td> 1 <th> 1 <td> 0 <td> 0 <td> 1 <td> 0 <td> ...
</table>
</div>

所以二进制下 π 是 11.0010<sub>two</sub>。嗯，对也不对。遗憾的是，11.0010<sub>two</sub> 实际上是 3.1250，而不是 3.1416。这里的问题在于，用 4 个比特你只能精确到最接近的 1/16 = 0.0625。要精确到 4 位小数，你需要大约 12 个比特（11.001001000100 ≈ 3.1416）。你也可以改用 hex 而不是二进制，那样这个数就是 3.243F<sub>sixteen</sub>。

#### 进制之间的转换

你可能想知道我是怎么得到这些转换的。其实并不难：你只需不断除以基数并取余数，直到除尽为止；余数的串就是转换后的数。例如，把十进制 1110 转成 hex，过程如下：

<div class="lblock">
<table class="table-data rules-cols">
<tr><th> num  <th> / 16 <th> %16
<tr><td> 1110 <td> 69   <td> 6
<tr><td>   69 <td> 4    <td> 5
<tr><td>    4 <td> 0    <td> 4
<tr><th>result:<td colspan=2>456h
</table>
</div>

这个策略对浮点数也有效，但最好先把数字拆成整数部分和小数部分。还要记住，除以一个分数就等同于乘以它的倒数。拿起你的计算器试试看。

实际上，进制之间有多种转换方法。这里给出的用除法的方法最容易编程，但也可能是最慢的。对 GBA 来说尤其如此，因为它没有硬件除法。你可以阅读 Douglas W. Jones 的[“有限精度下二进制到十进制的转换”](https://homepage.divms.uiowa.edu/~jones/bcd/decimal.html)了解另一种策略。

#### 科学计数法 {#num-sci}

进位制的另一个用处是所谓的数字的<dfn>科学计数法</dfn>（scientific notation）。它能帮你摆脱那些困扰大数和小数的多余零，同时指出有效数字的位数。例如，如果你看科学书籍，可能会读到地球的质量是 5,974,200,000,000,000,000,000,000 kg。这个数字有两个问题。首先，数值本身是不正确的：它不是精确到最后一位的 59742 后面跟 20 个零千克；在物理学中这种精度根本不可能（量子力学可能是个例外，其理论可以精确到惊人的 14 位小数。没错，那个“模糊”的东西实际上拥有*所有*科学领域中最高的精度）。涉及行星质量时，前 3 到 5 位数字可能是准确的，其余通常是垃圾。第二个问题更明显：这个数字实在太长了，根本写不下！

科学计数法解决了这两个问题。乘以 10 的幂实际上是在移动小数点，从而可以去掉那些零。地球的质量可以简洁地写成 5.9742·10<sup>24</sup>，即 5.9742 乘以 10 的 24 次方。你也可能碰到更短的记法 5.9742e+24，其中“·10\^”被替换成了表示指数的‘e’。别误读成十六进制数。是的，我知道这是速记的速记。我能说什么呢，搞数学的人都是懒惰的混蛋。此外，这个数字还表明你有 5 位有效数字，此后你做的任何计算都需要尊重这一点。

当然，这种记法适用于任何基数，只要记住跨进制转换需要整个数字一起转。

#### 它没你想的那么难

本节所述的概念可能看起来很难，但我向你保证它们其实相当容易理解。这些内容都在小学或中学教过；唯一的问题是，他们那时只用了十进制。正如我所说，进位制在所有基数下运作方式都是等价的，唯一的区别是你对十进制做过大量*练习*，而对其他进制几乎没有。如果你当初背的是十六进制乘法表而不是十进制，你会发现后者用起来很别扭。

## 位与字节 {#sec-bits}

任何自尊的程序员都知道，计算机的运行全关乎那些可以开或关的小开关。这意味着计算机比十进制更适合用二进制（或也许是 hex）来表示。每个开关称为一个<dfn>位</dfn>（bit）；计算机内存基本上就是千千万万个位的海洋。为了让事情更易管理，位常被分组为<dfn>字节</dfn>（bytes）。如今 1 字节 = 8 位是标准，但一些较老的系统用过 6、7 或 9 位的字节。

既然*一切*都只是 1 和 0，计算机就是“符号意义”的最佳例证：这里一切都关于解释。这些位可以表示任何东西：除了开关和数字，你还可以把它们解释为字母、颜色、声音，应有尽有。在本节中，我会解释几种解释位的方式。我会经常混用二进制和 hex，为了方便在两者之间切换。

### 整数表示 {#ssec-bits-int}

位的一个明显用途是数字，尤其是整数。用 8 位，你有 2<sup>8</sup>=256 个不同的数，范围从 0 到 1111,1111<sub>two</sub>（hex 下是 FFh，十进制下是 255）。这不多，所以还有 16 位（10000h 或 65536 个数）和 32 位（10000:0000h 或 4,294,967,296 个数）的分组。在 2000 年代后期，PC 转向了 64 位 CPU；我甚至不想把那个数写出来。对应的 C 类型是 `short`（16 位）、`int` 或 `long`（32 位），以及 `long long`（64 位）。`int` 或 `long` 的大小实际上依赖于系统，但在 GBA 上两者都是 32 位。

#### 负数 {#bits-int-neg}

你有 *n* 位来表示一个数，并不一定意味着你必须把它们用于范围 \[0, 2<sup>n</sup>−1\]，也就是正整数。那负数呢？表示负数有几种方式。一种很简单的方式是用其中一个位作为<dfn>符号位</dfn>（sign bit）：0 表示正数，1 表示负数。例如，二进制 1000,0001 可以是‘−1’。一些系统这么做，但 GBA 不这么做，因为有更聪明的方式。

让我们再次请出里程表。在一个三位里程表中，你可以从 0 走到 999。先别管三位里程表说明了什么车的质量，只关注数字。到 999 时，*每一位*都会归零，你又回到 0。你也可以认为 0 *之前*的那个数是 999。换句话说，‘999’将是 −1 的表示。你可以把完整的一千个范围分成两半：前一半给前五百个正数（0 到 499），另一半给前五百个负数（−500 到 −1），即倒着从 0 往下数，利用归零。这种编号方式称为<dfn>十的补码</dfn>（ten's complement）。下面的表格展示了这在 3 位数下是如何运作的。

<div class="lblock">
<table id="tbl:10cmpl" class="table-data">
<caption align="bottom">
  <b>*@tbl:10cmpl</b>: ten's complement for 3 digits
</caption>
<tbody align="center">
<tr><th>Number
  <td>-500 <td>-499 <td>-498 <td> ...  <td>-2   <td>-1
  <td>0    <td>1    <td> ... <td> 497  <td> 498 <td> 499

<tr><th>Representation
  <td> 500 <td> 501  <td> 502 <td> ... <td> 998 <td> 999
  <td> 0   <td> 1    <td> ... <td> 497 <td> 498 <td> 499
</tbody>
</table>
</div>

以上是实践，下面是背后的理论。负数与减法紧密相连；你几乎可以把减法看作其定义的一部分。基本上，对每个数 *x*，下面这个式子应当成立：

<table id="eq:sum-xeqmx">
<tr>
  <td class="eqnrcell">({!@eq:sum-xeqmx})
  <td class="eqcell">
0 = *x* + (−*x*)
  </td>
</tr>
</table>

这可以看作零的补码：数 (−*x*) 是你加在 *x* 上得到 0 的那个数。在十的补码中，它们要加到 10 或 10 的幂。在我们的里程表里，1000 与 0 表示相同，从一千往下数就等同于从零往下数。不过，你*必须*事先知道数字的位数；否则它就失效了。使用 *m* 位表示 -*x* 的实际方式，可推导如下：

<!--
\begin{matrix}
0 & = & x+(-x) \\
\cong & & \cong \\
10^m & = & x+(-x) \\
(10^m-1)-x+1 & = & -x
\end{matrix}
-->
<table id="eq:cmpl-def">
<tr>
  <td class="eqnrcell">(!@eq:cmpl-def)</td>
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
                  <mn>0</mn>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>x</mi>
                  <mo>+</mo>
                  <mo stretchy="false">(</mo>
                  <mo>&#x2212;</mo>
                  <mi>x</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mo>&#x2245;</mo>
                </mtd>
                <mtd></mtd>
                <mtd>
                  <mo>&#x2245;</mo>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <msup>
                    <mn>10</mn>
                    <mi>m</mi>
                  </msup>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mi>x</mi>
                  <mo>+</mo>
                  <mo stretchy="false">(</mo>
                  <mo>&#x2212;</mo>
                  <mi>x</mi>
                  <mo stretchy="false">)</mo>
                </mtd>
              </mtr>
              <mtr>
                <mtd>
                  <mo stretchy="false">(</mo>
                  <msup>
                    <mn>10</mn>
                    <mi>m</mi>
                  </msup>
                  <mo>&#x2212;</mo>
                  <mn>1</mn>
                  <mo stretchy="false">)</mo>
                  <mo>&#x2212;</mo>
                  <mi>x</mi>
                  <mo>+</mo>
                  <mn>1</mn>
                </mtd>
                <mtd>
                  <mo>=</mo>
                </mtd>
                <mtd>
                  <mo>&#x2212;</mo>
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
  </td>
</tr>
</table>

别慌，这些方程没看起来那么可怕。记住，对于 *m* 位，最大的数是 10<sup>m</sup>&minus;1。如果 *m* = 3，那就是十进制的 999、二进制的 111 或 hex 的 FFF。这让你无需借位就能完成对 *x* 的减法。十的补码不止是表示负数的一种方式；它还会把减法变成一种加法形式：减去 *y* 等价于加上它的十的补码。这个特性从一开始就包含在系统里，而其他负数表示方案并不具备这一性质。验证就当作读者的练习吧。

十的补码的二进制版本是<dfn>二的补码</dfn>（two's complement）。求一个数的二的补码其实比其他情况更容易：用 10<sup>m</sup>−1 减去 *x* 就是把 *x* 的所有位取反。以 76 为例：

<table>
<tr>
  <td class="fill">&nbsp;
  <td class="eqcell">
  <table class="eqtbl" cellpadding=2 cellspacing=0>
  <col align="right">
  <col align="center">
  <col align="left">
  <tr>
    <th>255: <td>1111 1111 <td>
  <tr>
    <th class="bdrB">76:
	<td class="bdrB">0100 1100 
	<td class="bdrB">&minus;
  <tr>
    <th>179:
    <td>1011 0011
  </table>
</table>

8 位的 −76 就是 179+1=180 (10110100<sub>two</sub>)，你确实会看到 180+76 = 256 = 2<sup>8</sup>，完全符合预期。

#### 有符号不等于无符号 {#bits-int-sign}

我之前已经提过这一点，但它足够重要，值得再说一遍：使用十的补码时，你*必须*事先知道数字的位数，否则你不知道要从哪个数里减去 *x*。大多数时候你可以对这些一无所知，但确实有少数情况它真的很重要。在 C 或汇编编程中，整数有两种类型：<dfn>有符号</dfn>（signed）和<dfn>无符号</dfn>（unsigned），而且只有*有符号*类型才使用二的补码。区别体现在最高位（most significant bit）的解释上：在无符号数中，它只是一个普通位。但在有符号数中，它充当符号位，因此在*类型转换*或*移位*等操作中需要被保留。例如，8 位的 FF<sub>sixteen</sub> 是有符号的‘−1’或无符号的‘255’。转换为 16 位时，前者应变成 FFFF<sub>sixteen</sub>，而后者仍保持 00FF<sub>sixteen</sub>。如果你曾见过数字变负时一切都乱套了，这可能就是原因。

以下是选择有符号或无符号类型的一些指导原则。本质上是有符号类型的是那些有物理对应物的数：位置、速度之类的东西。它们的一个关键特征是，你应当对其进行算术运算。充当开关的变量通常是无符号的，用于在 GBA 上启用各项功能的位标志就是主要例子。它们通常使用逻辑运算如掩码和取反（见[位操作](#sec-bitops)一节）。然后是数量和计数器。它们可以是有符号或无符号，但考虑先从无符号开始，只有在真的必须时才切换到有符号。再次强调，这些只是建议，不是违背就会下地狱的戒律。

:::note

无符号和有符号类型在类型转换、比较和位运算下表现可能不同。一个包含 FFh 的字节 *x* 可能表示有符号的 −1 或无符号的 255。在这种情况下：

<div class="lblock">
<table class="table-data">
<tr><td>FFh	<th>signed 		<th>unsigned
<tr><th>comparison x&lt;0
  <td>true <td> false
<tr><th>conversion to 16 bit
  <td>FFFFh (-1) <td> 00FFh (255)
<tr><th>shift right by 1
  <td>FFh (-1) <td> 7Fh (127)
</table>
</div>

:::

### 字符 {#ssec-bits-char}

不，我说的不是 GBA 图块，而是字母那种（正因可能混淆，我并不喜欢用“character”来称呼图块）。为了日常用途，你需要 2×26 个字母、10 个数字、一堆标点符号，外加侧边可能几个额外字符：这至少约 70 个字符，所以你需要 7 位来表示它们全部（6 位只能容纳 2<sup>6</sup>=64 个字符）。为了将来可能的扩展，最好用 8 位，而且因为它是个漂亮的整数——在二进制下。这也是字节这种分组很方便的部分原因：每个字符一个字节。

#### ASCII

知道你需要哪些字符只是故事的一部分：你还需要把它们分配给某些数字。任何字母表的顺序，再次说明，仅仅是一种约定（好吧，有些顺序比别的更合理，参见托尔金的“腾格瓦文字”，《魔戒》附录 E，但拉丁字母表完全是随机的）。一种可能的排列是拿一个普通键盘，按按键顺序走一遍。好在这不是标准。字符分配的通用编码是 <dfn>ASCII</dfn>：*美国信息交换标准代码*（American Standard Code for Information Interchange）。

ASCII 的下半部分 128 个字符如下。前 32 个是控制码。其中只有少数几个仍有意义：08h（退格，`\b`）、09h（制表符，`\t`）、0Ah（换行，LF，`\n`）和 0Dh（回车，CR，`\r`）。如果你曾从 Unix/Linux 服务器下载过文本文件，可能注意到所有换行都被去掉了：这是因为 CP/M、MS-DOS 和 Windows 使用 CRLF（`\r\n`）作为换行，而 Unix 环境只使用换行。

真正的字符从 20h（空格字符）开始。注意数字、大写和小写字符是依次排列且合乎逻辑的。数字从 30h 开始，大写从 41h 开始，小写从 61h 开始。字母的字母顺序便于排序，不过我要指出大写和小写相差 32 这一点可能导致问题。

ASCII 集还有上半部分 128 个字符，但这些在不同语言设置下可能不同。通常，它们会包含非英语语言中常见的带重音字符。在 DOS 环境下，它们还包含一些用于边框等的纯图形字符。ASCII 并非唯一的字符集。中文和日文中通常使用 16 位的 <dfn>Unicode</dfn>（统一码），因为 8 位的 ASCII 根本不足以容纳成千上万个字符。ASCII 基本上是 Unicode 的一个子集。

字符的 C 类型称为 <dfn>char</dfn>。一个 **char** 实际上是一个*有符号*的 8 位整数。我提到这个，是因为我清楚地记得很久以前曾因这个小事实被拖入一场漫长的查虫之旅。老实说，我认为 char 类型的默认符号性其实是平台相关的，所以请当心。

<div class="cblock">
<table id="tbl:ascii" class="table-data">
<caption align="bottom">
  <b>*@tbl:ascii</b>: ASCII 0-127
</caption>
<tr><td>
  <table class="border-none"><tr><th>dec <th>hex <th>Char
    <tr><td> 0 <td>00h <th>NUL
    <tr><td> 1 <td>01h <th>	
    <tr><td> 2 <td>02h <th>    <tr><td> 3 <td>03h <th>	
    <tr><td> 4 <td>04h <th>    <tr><td> 5 <td>05h <th>	
    <tr><td> 6 <td>06h <th>ACK  <tr><td> 7 <td>07h <th>BELL
    <tr><td> 8 <td>08h <th>BS   <tr><td> 9 <td>09h <th>HT
    <tr><td>10 <td>0Ah <th>LF
    <tr><td>11 <td>0Bh <th>	
    <tr><td>12 <td>0Ch <th>FF   <tr><td>13 <td>0Dh <th>CR
    <tr><td>14 <td>0Eh <th>    <tr><td>15 <td>0Fh <th>	
    <tr><td>16 <td>10h <th>    <tr><td>17 <td>11h <th>	
    <tr><td>18 <td>12h <th>    <tr><td>19 <td>13h <th>	
    <tr><td>20 <td>14h <th>    <tr><td>21 <td>15h <th>	
    <tr><td>22 <td>16h <th>    <tr><td>23 <td>17h <th>	
    <tr><td>24 <td>18h <th>    <tr><td>25 <td>19h <th>	
    <tr><td>26 <td>1Ah <th>^Z   <tr><td>27 <td>1Bh <th>ESC
    <tr><td>28 <td>1Ch <th>    <tr><td>29 <td>1Dh <th>	
    <tr><td>30 <td>1Eh <th>    <tr><td>31 <td>1Fh <th>	
  </table>
<td>
  <table class="border-none"><tr><th>dec <th>hex <th>Char
    <tr><td>32 <td>20h <th>sp   <tr><td>33 <td>21h <th>!
    <tr><td>34 <td>22h <th>"    <tr><td>35 <td>23h <th>#
    <tr><td>36 <td>24h <th>$    <tr><td>37 <td>25h <th>%
    <tr><td>38 <td>26h <th>&amp;<tr><td>39 <td>27h <th>'
    <tr><td>40 <td>28h <th>(    <tr><td>41 <td>29h <th>)
    <tr><td>42 <td>2Ah <th>*    <tr><td>43 <td>2Bh <th>+
    <tr><td>44 <td>2Ch <th>,    <tr><td>45 <td>2Dh <th>-
    <tr><td>46 <td>2Eh <th>.    <tr><td>47 <td>2Fh <th>/
    <tr><td>48 <td>30h <th>0    <tr><td>49 <td>31h <th>1
    <tr><td>50 <td>32h <th>2    <tr><td>51 <td>33h <th>3
    <tr><td>52 <td>34h <th>4    <tr><td>53 <td>35h <th>5
    <tr><td>54 <td>36h <th>6    <tr><td>55 <td>37h <th>7
    <tr><td>56 <td>38h <th>8    <tr><td>57 <td>39h <th>9
    <tr><td>58 <td>3Ah <th>:    <tr><td>59 <td>3Bh <th>;
    <tr><td>60 <td>3Ch <th>&lt; <tr><td>61 <td>3Dh <th>=
    <tr><td>62 <td>3Eh <th>&gt; <tr><td>63 <td>3Fh <th>?
  </table>
<td>
  <table class="border-none"><tr><th>dec <th>hex <th>Char
    <tr><td>64 <td>40h <th>@    <tr><td>65 <td>41h <th>A
    <tr><td>66 <td>42h <th>B    <tr><td>67 <td>43h <th>C
    <tr><td>68 <td>44h <th>D    <tr><td>69 <td>45h <th>E
    <tr><td>70 <td>46h <th>F    <tr><td>71 <td>47h <th>G
    <tr><td>72 <td>48h <th>H    <tr><td>73 <td>49h <th>I
    <tr><td>74 <td>4Ah <th>J    <tr><td>75 <td>4Bh <th>K
    <tr><td>76 <td>4Ch <th>L    <tr><td>77 <td>4Dh <th>M
    <tr><td>78 <td>4Eh <th>N    <tr><td>79 <td>4Fh <th>O
    <tr><td>80 <td>50h <th>P    <tr><td>81 <td>51h <th>Q
    <tr><td>82 <td>52h <th>R    <tr><td>83 <td>53h <th>S
    <tr><td>84 <td>54h <th>T    <tr><td>85 <td>55h <th>U
    <tr><td>86 <td>56h <th>V    <tr><td>87 <td>57h <th>W
    <tr><td>88 <td>58h <th>X    <tr><td>89 <td>59h <th>Y
    <tr><td>90 <td>5Ah <th>Z    <tr><td>91 <td>5Bh <th>[
    <tr><td>92 <td>5Ch <th>\    <tr><td>93 <td>5Dh <th>]
    <tr><td>94 <td>5Eh <th>^    <tr><td>95 <td>5Fh <th>_
  </table>
<td>
  <table class="border-none"><tr><th>dec <th>hex <th>Char
    <tr><td>96 <td>60h <th>`    <tr><td>97 <td>61h <th>a
    <tr><td>98 <td>62h <th>b    <tr><td>99 <td>63h <th>c
    <tr><td>100 <td>64h <th>d    <tr><td>101 <td>65h <th>e
    <tr><td>102 <td>66h <th>f    <tr><td>103 <td>67h <th>g
    <tr><td>104 <td>68h <th>h    <tr><td>105 <td>69h <th>i
    <tr><td>106 <td>6Ah <th>j    <tr><td>107 <td>6Bh <th>k
    <tr><td>108 <td>6Ch <th>l    <tr><td>109 <td>6Dh <th>m
    <tr><td>110 <td>6Eh <th>n    <tr><td>111 <td>6Fh <th>o
    <tr><td>112 <td>70h <th>p    <tr><td>113 <td>71h <th>q
    <tr><td>114 <td>72h <th>r    <tr><td>115 <td>73h <th>s
    <tr><td>116 <td>74h <th>t    <tr><td>117 <td>75h <th>u
    <tr><td>118 <td>76h <th>v    <tr><td>119 <td>77h <th>w
    <tr><td>120 <td>78h <th>x    <tr><td>121 <td>79h <th>y
    <tr><td>122 <td>7Ah <th>z    <tr><td>123 <td>7Bh <th>{
    <tr><td>124 <td>7Ch <th>|    <tr><td>125 <td>7Dh <th>}
    <tr><td>126 <td>7Eh <th>~    <tr><td>127 <td>7Fh <th>DEL
  </table>
</table>
</div>

### IEEE(k)! 浮点数 {#ssec-bits-float}

最后一种最常见的类型是浮点数。有 32 位来表示一个数固然不错，但它仍意味着你受限于大约 40 亿个字符。这看起来是个大数，但我们已经见过更大的数了。浮点类型用二进制的科学计数法给出了解决方案。我已经描述过[浮点数](#num-float)（甚至二进制的），以及[科学计数法](#num-sci)，所以我不重复它们如何运作。

在计算机上描述浮点数，依据的是 <dfn>IEEE/ANSI</dfn> 标准（电气与电子工程师协会 / 美国国家标准协会）。浮点格式由三部分组成：符号位 *s*、指数 *e* 和小数部分 *f*。下面的表与方程描述了一个普通的 32 位浮点数的格式与含义

<div class="reg">
<table class="table-reg" id="tbl-float-fmt"
  border=1 frame=void cellpadding=4 cellspacing=0>
<caption class="reg">
  IEEE format for 32bit float
</caption>
<tr class="bits">
	<td>1F<td>1E 1D 1C 1B 1A 19 18 17
	<td>16 15 14 13 12 11 10 F E D C B A 9 8 7 6 5 4 3 2 1 0
<tr class="bf">
  <td class="rclr2">s
  <td class="rclr1">e
  <td class="rclr0">f
</table>
<br>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def">
<tr align="left"><th>bits<th>name<th>&nbsp;<th>description
<tbody valign="top">
<tr class="bg0">	
  <td>00-16<td class="rclr0">f
  <td>&nbsp;
  <td><b>Fractional</b> part (23 bits)
<tr class="bg1">	
  <td>17-1E<td class="rclr1">e
  <td>&nbsp;
  <td><b>Exponent</b> (8 bits)
<tr class="bg0">	
  <td>1F<td class="rclr2">s
  <td>&nbsp;
  <td><b>Sign</b> bit.
</tbody>
</table>
</div>

<!--
x=(-1)^s \cdot 1.f \cdot 2^{e-127}
-->
<table id="eq:float">
<tr>
  <td class="eqnrcell">(!@eq:float)</td>
  <td class="eqcell">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mstyle displaystyle="true" scriptlevel="0">
    <mrow data-mjx-texclass="ORD">
      <mtable rowspacing=".5em" columnspacing="1em" displaystyle="true">
        <mtr>
          <mtd>
            <mi>x</mi>
            <mo>=</mo>
            <mo stretchy="false">(</mo>
            <mo>&#x2212;</mo>
            <mn>1</mn>
            <msup>
              <mo stretchy="false">)</mo>
              <mi>s</mi>
            </msup>
            <mo>&#x22C5;</mo>
            <mn>1.</mn>
            <mi>f</mi>
            <mo>&#x22C5;</mo>
            <msup>
              <mn>2</mn>
              <mrow data-mjx-texclass="ORD">
                <mi>e</mi>
                <mo>&#x2212;</mo>
                <mn>127</mn>
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

注意，与有符号整数不同，这次确实有一个真正的符号位。此外，这个数总是以 1 开头，小数部分 *f* 确实是这个数的小数部分。这是合理的，因为如果不是这样，你总可以移动小数点直到小数点前只有一个 1。指数要减去 127，以允许负次幂（与二的补码数相似，但不完全一样）。两个例子：

<div class="lblock">
<table class="table-data">
<tr align="center"><th>x <th>s <th> e <th> f
<tr><th>1.0  <td>0 <td>01111111 <td> 000 0000 0000 0000 0000 0000
<tr><th>&minus;1.0 <td>1 <td>01111111 <td> 000 0000 0000 0000 0000 0000
</table>
</div>

方程 4 在通常情形下成立，但这一规则有几个例外。

-   如果 **e = f = 0**，则 *x* = 0。注意符号位仍可被置位，表示趋近于零的下限。
-   如果 **e = 0** 且 **f ≠ 0**，则该数太小而无法规范化，*x* = (−1)<sup>s</sup> × 0.*f* × 2<sup>−127</sup>
-   如果 **e = 255** 且 **f = 0**，则 *x* = +∞ 或 *x* = −∞
-   如果 **e = 255** 且 **f ≠ 0**，则 *x* = NaN，即*非数*（Not a Number）。例如 √−1 就是 NaN。

32 位的 **float** 有 23 位小数部分，意味着 24 位精度。每 10 位约等于一位十进制数，所以 24 位给出大约 7 位十进制精度，对你的目的而言可能够也可能不够。如果你需要更多，还有 8 字节的 **double** 和 10 字节的 **long double** 类型，它们有更长的指数和小数位。

如你所见，浮点格式远不如整数那样容易理解。算术和整型到浮点的转换都很棘手。这不只是对我们人类，计算机处理它们也可能很吃力。PC 通常有一个专门的浮点单元（FPU）来处理这类数。但 GBA 没有。因此，在这个系统上*强烈*不鼓励使用浮点数。那么这是否意味着，如果我们想用分数和小数之类的东西，就完蛋了？不，这个特定问题的解决方案叫做定点数运算（fixed-point math），我会在[这里](fixed.html)解释。

### AAaagghhh！大小端来了！ {#ssec-bits-endian}

整章里有一个约定我完全忽略了：<dfn>字节序</dfn>（endianness）。它关乎数字、位和字节的读取顺序。我一直默认数字中*最左边*的数字是最高位，即 *N* 的最高次幂。所以 1025 读作一千零二十五。这是<dfn>大端序</dfn>（big-endian），之所以这么叫，是因为大端（最高次幂）排在前面。还有<dfn>小端序</dfn>（little-endian），小端（最低次幂）排在前面。那样的话，1025 会被读作五千二百零一。再次强调，这只是一种平凡的约定，但你用哪一种关系重大。两者各有优点：口语通常是大端的，我们的数字系统也反映了这一点（除了少数国家把个位放在十位前面，如“五和二十”，这相当让人困惑）。但算术通常从小端开始，URL 也是如此。

计算机的字节序在两个领域起作用：字节内的位顺序，以及像 int 这样的多字节类型中的字节顺序。由于字节通常是你能操作的最小块，位顺序通常不太要紧。举个简单例子，看 int 0x11223344。它在不同系统上存储方式不同，见下表。试着想想要是你把它存进文件，再传给一个使用不同字节序方案的计算机，会发生什么。

<div class="lblock">
<table id="tbl:endian" class="table-data" width=30%>
<caption align="bottom">
  <b>*@tbl:endian</b>: storing 0x11223344
</caption>
<col span=5 align="center">
<tr><th>memory <th> 00 <th> 01 <th> 02 <th> 03
<tr><th>big    <td> 11 <td> 22 <td> 33 <td> 44
<tr><th>little <td> 44 <td> 33 <td> 22 <td> 11
</table>
</div>

那么我们应该用哪一种呢？嗯，问题就在这里：没有真正的标准答案。大端序的好处是，如果我们看到内存转储，数字会按人类阅读顺序排列。在小端序这边，较低的次幂位于较低的内存，这在数学上更合理。此外，当你有一个 16 位整数 *x* = 0x0012，把它的地址转换成 8 位指针时，值会被保留——我个人认为这是件好事。

```c
  u8 *pc;
  short i= 0x0012;
  pc= (u8*)&i;
  // little endian: *pc = 0x12, fine
  //    big endian: *pc = 0x00, whups
```

实际上有一个地方你能看到字节中的位顺序：位图。尤其是位深小于 8 的位图。一个 4bpp 位图中的一个字节表示两个像素。在 BMP 中，高 nybble 是偶数像素，低 nybble 是奇数像素。GBA 图形正好相反。可以说 BMP 的位是大端的，而 GBA 的位是小端的（不过*字节*在 PC 和 GBA 上都是小端的）。关于位图还有另一个与字节序相关的东西，就是颜色顺序：RGB（红-绿-蓝），还是 BGR（蓝-绿-红）。这里陷阱太多了，我甚至不想深入。

有趣的是，字节序还在另一个领域捣乱：日期。在欧洲我们用小端方案：日-月-年。中国、日本和 ISO 8601 标准使用大端日期：年-月-日。然后是美式英语方案，它非要让事情变难，用了月-日-年方案。这大概可以称为中端序吧。

归根结底，这不是哪个“更好”的问题，而是你在哪个系统上工作的问题。PC 和 GBA 是小端的；我听说 PowerPC Mac 和许多其他 RISC 芯片是大端的（不过我可能错了）。别卷入任何关于此的[圣战](https://www.rfc-editor.org/ien/ien137.txt)，只要意识到不同方案的存在，并在移植代码时多加小心。

## 位操作 {#sec-bitops}

顾名思义，位操作（bit-ops）作用于单个位的层面，因此是你所能想到的最低级的操作。大多数现实世界的应用很少需要摆弄位，因此即使使用也很少。很多编程语言甚至没有它们。汇编和 C（以及 Java）属于有它们的语言，但如果你看教科书，位操作通常被放到最后几页（是的，我意识到我也在这么做，但请记住 Tonc 并不是作为通用编程教程而写的；这些你应该已经懂了，至少大部分）。由于 GBA 编程非常贴近硬件，效果取决于各个位是否被置位（1）或清零（0），因此对位操作的良好理解是*必不可少*的！

位操作的基本清单是：OR、AND、NOT、XOR、左移/右移、循环左移/循环右移。共 8 种操作，尽管精通奥卡姆剃刀的人可能把它削减到 5 种，甚至 4 种。其中只有 OR、AND 和 XOR 是“真正”的位操作：它们可以用来改变单个位的值。其余的会改变一个变量的所有位。

### 真正的逐位位操作 {#ssec-bitops-true}

有 3 个逐位运算符：OR（包含或，符号‘|’）、AND（符号‘\&’）和 XOR（异或，符号‘\^’）。它们是二元运算符，即“以两个参数作为输入”。它们被称为<dfn>逐位</dfn>（bitwise）运算符，因为结果的第 *n* 位只受操作数第 *n* 位的影响。AND 和 OR 的作用与它们的逻辑对应物（&& 和 \|\|）非常相似。在 *c*=*a*&*b* 中，只有当 *a* *和* *b* 中该位都为 `1` 时，*c* 中的该位才是 `1`。对于 OR，*a* 位 *或* *b* 位（或两者）必须为 `1`。XOR 没有逻辑对应物，但它更贴近现实世界对“或”的定义：XOR 在 *a* 位 *或* *b* 位为 `1`（但不同时为 `1`）时为 `1`。

常被归入这一组的第四个操作是 NOT（一的补码，符号‘\~’）。NOT 是一元运算符，把操作数的所有位取反，这本质上是与 −1（二进制下全为 `1`）做 XOR。逐位 NOT 类似于逻辑 not（‘!’）。逻辑运算（‘&&’、‘\|\|’和‘!’）与它们的逐位对应物（‘&’、‘\|’、‘\~’）有一个重要区别，尽量不要混淆它们。

这四个操作通常写在真值表里，列出所有可能的输入组合及其结果。注意真值表是逐位地看，而不是把变量作为整体看，尽管运算符本身总是作用于变量。表 8 展示了字节 0Fh 和 35h 上这些运算符的例子。

<div class="lblock">
<table id="tbl:bitops-truth">
<caption align="bottom">
  <b>*@tbl:bitops-truth</b>: bit operations
</caption>
  <tr valign="top"><td>
    <table class="table-data rules-groups">
    <colgroup align="center">
    <colgroup align="center">
    <colgroup align="center">
    <colgroup align="center">
    <thead>
      <tr><th>a b <th> a&amp;b <th> a|b <th> a^b
    <tbody>
      <tr><td>0 0 <td> 0 <td> 0 <td> 0
      <tr><td>0 1 <td> 0 <td> 1 <td> 1
      <tr><td>1 0 <td> 0 <td> 1 <td> 1
      <tr><td>1 1 <td> 1 <td> 1 <td> 0
    </table>
  <td width=32>
  <td>
    <table class="table-data rules-groups">
    <colgroup align="center">
    <colgroup align="center">
    <thead>
	  <tr><th> a <th> ~a
    <tbody>
      <tr><td> 0 <td> 1
      <tr><td> 1 <td> 0
    </table>
</table> <!-- /frame -->
</div>

<div class="lblock">

<!-- frame for masked results -->
<table id="tbl:bitops-eg">
<caption>
  <b>{*@tbl:bitops-eg}a</b>: bit-ops examples
</caption>
  <col span=4 width=144>
  <tr valign="bottom"><td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <tr><th align="center" colspan=3>AND
    <tr>
	  <th><code>0Fh</code>
	  <td><code>0000<font color=blue><b>1111</b></font></code>
    <tr>
	  <th class="bdrB"><code>35h</code>&nbsp;
	  <td class="bdrB"><code>00110101</code>&nbsp;
	  <td class="bdrB"> &amp;
    <tr>
	  <th><code>05h</code>
	  <td><code><font color=red><b>0000</b></font>0101</code>
  </table>
  <td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <tr><th align="center" colspan=3>OR
    <tr>
	  <th><code>0Fh</code>
	  <td><code>0000<font color=blue><b>1111</b></font></code>
    <tr>
	  <th class="bdrB"><code>35h</code>&nbsp;
	  <td class="bdrB"><code>00110101</code>&nbsp;
	  <td class="bdrB"> |
    <tr>
	  <th><code>3Fh</code>
	  <td><code>0011<font color=red><b>1111</b></font></code>
  </table>
  <td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <tr><th align="center" colspan=3>XOR
    <tr>
	  <th><code>0Fh</code>
	  <td><code>0000<font color=blue><b>1111</b></font></code>
    <tr>
	  <th class="bdrB"><code>35h</code>&nbsp;
	  <td class="bdrB"><code>00110101</code>&nbsp;
	  <td class="bdrB"> ^
    <tr>
	  <th><code>3Ah</code>
	  <td><code>0011<font color=red><b>1010</b></font></code>
  </table>
  <td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <tr><th align="center" colspan=3>NOT
    <tr><td>&nbsp;
    <tr>
	  <th class="bdrB"><code>0Fh</code>&nbsp;
	  <td class="bdrB"><code>00001111</code>&nbsp;
	  <td class="bdrB"> ~
    <tr>
	  <th><code>F0h</code>
	  <td><code><font color=red><b>11110000</b></font></code>
  </table>
</table>  <!-- /frame for masked results -->
</div>

我希望你已经注意到一些位被上了色。是的，这是有目的的。知道位操作做什么是一回事；知道如何*使用*它们是另一回事。一个位就是一个二进制开关，你可以对一个开关做四件事：不管它、翻转它、把它打开、把它关闭。换句话说，你可以：

-   **保持**当前状态，
-   **翻转**它（0→1，1→0），
-   **置位**它（*x*→1），以及
-   **清零**它（*x*→0）

如果你看真值表和例子，可能已经看出来这怎么运作了。OR、AND、XOR 是二元运算符，你可以把两个操作数看作源变量 *s* 和一个<dfn>掩码</dfn>（mask）变量 *m*，它告诉你哪些位受影响。在表 8a 中我用 *s*=35h、*m*=0Fh；掩码由置位的位（蓝色）组成，红色的位是受影响的位。如果你细看表格，会发现 OR 置位、XOR 翻转、AND 保持（即清零未被掩码的位）。要清零被掩码的位，你需要先对掩码取反，也就是 *s* AND NOT *m* 操作。注意前三个是可交换的（*s* OP *m* = *m* OP *s*），但最后一个不是。这种位操作的掩码解释非常有用，因为你常会像这样用它们来只改变某些寄存器的位，使用 C 的赋值运算符如‘\|=’。

<div class="lblock">

<!-- frame for masked results -->
<table>
<caption align="bottom">
  <b>{*@tbl:bitops-eg}b</b>: bit-ops examples encore,
  using source <i>s</i>=35h and mask <i>m</i>=0Fh
</caption>
<col span=4 width=144>
<tr valign="bottom">
  <td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <caption><b>AND (keep bits)</b><br> <i>s &amp; m</i></caption>
    <tr>
	  <th><code>35h</code>&nbsp;
	  <td><code>00110101</code>&nbsp;
    <tr>
	  <th class="bdrB"><code>0Fh</code>
	  <td class="bdrB"><code>0000<font color=blue><b>1111</b></font></code>
	  <td class="bdrB"> &amp;
    <tr>
	  <th><code>05h</code>
	  <td><code><font color=red><b>0000</b></font>0101</code>
  </table>
  <td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <caption><b>OR (set bits)</b> <br> <i>s | m</i></caption>
    <tr>
	  <th><code>35h</code>&nbsp;
	  <td><code>00110101</code>&nbsp;
    <tr>
	  <th class="bdrB"><code>0Fh</code>
	  <td class="bdrB"><code>0000<font color=blue><b>1111</b></font></code>
	  <td class="bdrB"> |
    <tr>
	  <th><code>3Fh</code>
	  <td><code>0011<font color=red><b>1111</b></font></code>
  </table>
  <td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <caption><b>XOR (flip bits)</b> <br> <i>s ^ m</i></caption>
    <tr>
	  <th><code>35h</code>&nbsp;
	  <td><code>00110101</code>&nbsp;
    <tr>
	  <th class="bdrB"><code>0Fh</code>
	  <td class="bdrB"><code>0000<font color=blue><b>1111</b></font></code>
	  <td class="bdrB"> ^
    <tr>
	  <th><code>3Ah</code>
	  <td><code>0011<font color=red><b>1010</b></font></code>
  </table>
  <td>
  <table class="eqtbl" cellpadding=2 cellspacing=0>
    <caption><b>AND NOT (clear bits)</b> <br> <i>s &amp;~ m</i></caption>
    <tr>
	  <th><code>&nbsp;35h</code>&nbsp;
	  <td><code>00110101</code>&nbsp;
    <tr>
	  <th class="bdrB"><code>~0Fh</code>
	  <td class="bdrB"><code>1111<font color=blue><b>0000</b></font></code>
	  <td class="bdrB"> &amp;
    <tr>
	  <th><code>&nbsp;30h</code>
	  <td><code>0011<font color=red><b>0000</b></font></code>
  </table>
</table>  <!-- /frame for masked results -->
</div>

### 非逐位的位操作 {#ssec-bitops-false}

然后是移位和循环操作。与前面的操作不同，它们作用于整个变量。每个变量都是一个位串，通过移位和循环操作你可以在变量中移动这些位。两者都有左移和右移变体，且都是二元操作，第一个操作数是源数字，第二个是要移动的位数。我暂且把左移/右移称为 SHL 和 SHR，把循环左移/右移称为 ROL 和 ROR。这听起来像汇编指令，但其实不是。至少，不是 ARM 汇编。左移/右移有 C 运算符‘\<\<’和‘\>\>’，但 C 没有位循环运算符，尽管你可以用移位构造出该效果。如前所述，移位和循环在变量中移动位，方式基本如你所料：

<div class="lblock">
<table id="tbl:shift" class="table-data rules-groups">
<caption align="bottom"><b>*@tbl:shift</b>: shift / rotate operations on
  byte 35h (<code>00110101</code>)</caption>
<colgroup>
<colgroup>
<colgroup>
<colgroup>
<thead>
<tr align="center">
  <th>name <th> symbol <th>example <th> result
<tbody>
<tr>
  <th>shift left <td> SL, &lt;&lt;
  <td> <code>00<font color=red><b>110101</b></font></code> &lt;&lt; 2
  <td> <code><font color=red><b>110101</b></font>00</code>, D4h
<tr>
  <th>shift right <td> SR, &gt;&gt;
  <td> <code>00<font color=red><b>110101</b></font></code> &gt;&gt; 2
  <td> <code>0000<font color=red><b>1101</b></font></code>, 0Dh
<tr>
  <th>rotate left <td> ROL
  <td> <code>00<font color=blue><b>110101</b></font></code> ROL 3
  <td> <code><font color=blue><b>10101</b></font>00<font
    color=blue><b>1</b></font></code>, A9h
<tr>
  <th>rotate right <td> ROR
  <td> <code>00<font color=blue><b>110101</b></font></code> ROR 3
  <td> <code><font color=blue><b>101</b></font>00<font
    color=blue><b>110</b></font></code>, A6h
</table>
</div>

移位有两个用途。首先，你可以轻松找到第 *n* 位，或用 `1<<`*n* 找到 2 的第 *n* 次幂。说到幂，移位本质上就是补零或去掉位，即乘以或除以 10——二进制下的 10。所以你可以用移位来快速乘或除以 2。后者尤其有用，因为除法在 GBA 上非常、非常昂贵，而移位是一条单周期指令。我实在想不出循环现在的什么用处，但我相信它们是存在的。

好，以上是理论上它们的作用。但在*实践*中，还有更多名堂。一个立刻显而易见的问题是，变量大小很重要。8 位变量上的循环与 16 位上的循环会大不相同。循环还有可能把进位位也包括进来，但眼下这并不重要，因为位循环纯属汇编领域，超出了本页范围。

真正要紧的是移位的一些讨厌之处。左移问题不大，除非你移的位数超过了变量的位数。但右移对于负数有一个特别讨厌的问题。例如，8 位的 −2 用二的补码表示为 `FEh`。如果你右移一位，会得到 `7Fh`，即 128，而不是 −2/2 = −1。这里的问题在于第一位充当符号位，应具有特殊意义。右移时，符号位需要被保留并扩展到其他位，这样才能保证结果既是负数又表示除以 2 的幂。实际上有两条右移指令：*算术*右移和*逻辑*右移（ASR 和 LSR）；前者扩展符号位，后者不扩展。在 C 中，变量类型的[符号性](numbers.html#bits-int-sign)决定了使用哪条指令。

以 8 位 80h 这个有趣的例子来看，它既是无符号的 128，也是有符号的 −128。右移 3 位应分别得到 16 和 −16。无符号情况是 10h，有符号情况是 F0h，看哪，这正是你是否扩展符号位的结果。

<div class="lblock">
<table id="tbl:sign" class="table-data">
<caption align="bottom">
  <b>*@tbl:sign</b>: signed and unsigned <code>80h&gt;&gt;3</code>
</caption>
<col span=3 align="center">
<tr><th>type <b>char</b><th> unsigned <th> signed
<tr>
  <td><code><font color=blue><b>1</b></font>000 0000</code>
  <td>&nbsp;128 <td> &minus;128
<tr>
  <td><code>80h&gt;&gt;3</code>
  <td> <code>000<font color=red><b>1</b></font> 0000</code>
  <td> <code><font color=red><b>1111</b></font> 0000</code>
<tr>
  <td>&nbsp;<td> 16 <td> &minus;16
</table>
</div>

我知道这看起来是个很小很平凡的问题，确实通常如此。但当它不是的时候，你可能要面对一场漫长的查虫之旅。而且这不限于移位，顺便说一句，*所有*位操作都可能受此问题困扰。

### 用位操作做算术 {#ssec-bitops-arith}

移位运算符可以用来乘除 2 的幂。其他位操作也有算术解释。

例如，对 2 的幂取模本质上就是砍掉高位，可以用 AND 操作完成：*x*%2<sup>n</sup> = *x* AND 2<sup>n</sup>−1。例如，*x*%8 = *x*&7。

OR 操作可以用作加法，但*仅当*受影响的位一开始就是 0 时。F0h \| 01h = F1h，与 F0h+01h 相同。然而 F0h \| 11h 也等于 F1h，但 F0h+11h 实际上是 101h。用这个时要小心，并在别人代码里看到它时记上一笔。

多亏了[二的补码](#bits-int-neg)，我们可以用 XOR 做减法：(2<sup>n</sup>−1)−*x* = (2<sup>n</sup>−1) XOR *x*。这可以用来反转循环的遍历顺序，例如，在你想对翻转后的图块做碰撞检测时很有用。是的，这有点 hack，但那又怎样？

```c
int ii, mask;

for(ii=0; ii<8; ii++)
{
    // array direction based on mask
    // mask=0 -> 0,1,2,3,4,5,6,7
    // mask=7 -> 7,6,5,4,3,2,1,0
    ... array[ii^mask] ...
}
```

OR 和 XOR 很少以其算术形式出现，但移位和 AND 倒是常能见到。在没有硬件除法（如 GBA）的系统上尤其如此，因为那时除法和取模都是昂贵的操作。这就是为什么尺寸和类似的东西偏好用 2 的幂，这样就可以改用更快的位操作。幸运的是，编译器足够聪明，会把比如除以 8 优化成右移 3 位，所以如果你不想，就不必自己写下位操作版本。请注意，这只在 a) 第二个操作数是常量，且 b) 该常量是 2 的幂时才有效。

<div class="lblock">
<table id="tbl:bitops-arith" class="table-data rules-groups">
<caption align="bottom">
  <b>*@tbl:bitops-arith</b> Arithmetic bit-ops summary
</caption>
<colgroup valign="bottom">
<colgroup align="center" valign="bottom">
<colgroup align="center" valign="bottom">
<thead>
<tr>
  <th>bit-op <th>arithmetic function <th>example
<tbody>
<tr>
  <td>SHL
  <td><i>x</i>&lt;&lt;<i>n</i> 
    = <i>x</i> * 2<sup><i>n</i></sup>
  <td><i>x</i>&lt;&lt;3 = <i>x</i> * 8
<tr>
  <td>SHR
  <td><i>x</i>&gt;&gt;<i>n</i> 
    = <i>x</i> / 2<sup><i>n</i></sup>
  <td><i>x</i>&gt;&gt;3 = <i>x</i> / 8
<tr>
  <td>AND
  <td><i>x</i>&amp;(2<sup><i>n</i></sup>&minus;1) 
    = <i>x</i> % 2<sup><i>n</i></sup>
  <td><i>x</i>&amp;7 = <i>x</i> % 8
</table>
</div>

现在表演我今天的最后一个戏法，让我们仔细看看最基础的算术运算：加法。准确地说，是两个位的加法，其真值表可在下面的表 12 找到。如果你到目前为止一直专心（干得好！我没想到真有人能坚持到这儿 <kbd>:P</kbd>），结果的两列应该有些眼熟。右列只是 *a* XOR *b*，左列是 *a* AND *b*。这意味着你可以用一个 AND 和一个 XOR 门构建一个 1 位加法器，这种电子元件在任何 Radio Shack 或其本地等价物里都能找到。把 8 个这样的串联起来就是一个 8 位加法器，你就拥有了 8 位计算机的基础，酷吧？

<div class="lblock">
<table id="tbl:adder" class="table-data rules-groups" width=20%>
<caption align="bottom">
  <b>*@tbl:adder</b>: 1&minus;bit adder
</caption>
<colgroup align="center">
<colgroup align="center">
<colgroup align="center">
<thead>
  <tr><th>a b <th> a+b
<tbody>
  <tr><td>0 0 <td> 00
  <tr><td>0 1 <td> 01
  <tr><td>1 0 <td> 01
  <tr><td>1 1 <td> 10
</table>
</div>

### 当心位操作 {#ssec-bitops-caveat}

使用位操作时，有两件事你*永远*要记住。第一件我已经提过，就是它们可能搞乱变量的符号。不过这只对有符号整数有意义。

第二个问题关乎位操作的优先级。除了 NOT（`~`），位操作的优先级非常低；低于加法，在某些情况下甚至低于条件运算符。你的 C 手册应该有一份优先级列表，所以我让你去查详情。同时，准备好用括号把你的代码淹没吧。

