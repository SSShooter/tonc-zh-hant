# 22. Tonc 的文本引擎

<!-- toc -->

## 简介 {#sec-intro}

[文本篇](text.html)讲述了如何在背景和对象上显示文本。它能用，但有几个局限。例如，它仅限于 8×8 字体，不支持所有视频模式，也没有格式化文本的能力。

Tonc 的文本引擎（TTE）弥补了其中的许多不足。在本章中，我将描述该系统的目标和基本设计，以及一些实现细节。特别地，我会说明如何为不同种类的表面构建写入器（writer）。在某些情况下，我会把性能优化到极致，因为如果不够注意的话，一个字形渲染器在渲染单个字符时可能会占用多条扫描线的时间。是的，这部分将用汇编来完成。

我还会展示如何添加一些基本的脚本功能，以动态改变光标位置、颜色甚至字体。几年前，Wintermute 修改了 devkitARM 中的标准 C 库，使 stdio 例程可用于 GBA 和 NDS。我也会展示如何利用这一点。

当然，还会有演示程序。哦，肯定会有很多演示程序。事实上大概有 10 个，所以我打算采用与以往稍有不同的方式：会有一个包含所有示例的菜单项目。并非所有示例都会在这里展示，因为那样就太多了。

最后，假定你此时已对 GBA 编程有相当的了解，所以我会把 GBA 特有的说明降到最低。当你看到使用到尚未介绍过的函数时，请查阅 GBATEK、项目代码或 libtonc 的代码以获取细节。

## 基本设计 {#sec-design}

### TTE 的目标 {#ssec-design-goals}

TTE 中最想要具备的东西列在下面：

- **一套全面且可扩展的字形写入器集合，适用于各种场合**。嗯，几乎是各种场合。旧系统适用于常规背景、位图模式和对象，我现在把这套集合扩展到仿射背景和图块渲染。如果你需要的标准集合里没有的东西，你可以轻松创建自己的写入器并使用它。该写入器会接受 [UTF-8](https://en.wikipedia.org/wiki/UTF-8) 字符串，意味着你不限于 256 个字符。
- **字体：任意宽度和高度以及变宽字符**。不再局限于 8x8@1 的字形；TTE 中的标准写入器能够使用任意宽度和高度的字体（合理范围内：拜托不要有占满屏幕的字形），以及变宽字体（同样在合理范围内：用于图块映射的 VWF 意义不大）。原则上，也有使用任意位深的可能性，但标准渲染器仅限于 1bpp。
- **与表面细节无关的简单的写入器接口**。对于旧系统，我有 `m3_puts()`、`se_puts()`、`obj_puts()` 等等。这能工作，但意味着你得为不同的模式使用不同的函数。在 TTE 中，不同模式有不同的初始化函数来搭建系统，还有一个统一的字符串写入器 `tte_write()`，直接就能用。
- **文本参数的脚本化**。我的意思是，你可以通过字符串本身来控制位置、输出颜色等参数。这方面的功能相当基础，但足够好用。注意：这_不是_一个完整的对话框系统！话虽如此，在其基础上构建一个应该是可行的。
- **`printf()` 支持**。原因相当明显。

### 结构与主要组件 {#ssec-design-items}

TTE 的所有相关信息都集中保存在三个结构体中：一个 <dfn>文本上下文</dfn>（text context）`TTC`；一个 <dfn>字体描述</dfn>（font description）`TFont`；以及一个 <dfn>图形表面描述</dfn>（graphic surface description）`TSurface`。

`TTC` 结构体包含引擎的主要参数：关于渲染目标的表面、光标位置、字体信息、颜色属性以及一些其他内容。它还包含两个用于绘制和擦除字形的回调。

`TFont` 结构体有一个指向字形数据、字形/单元格尺寸以及一些其他内容的指针。还有指向宽度和高度表的指针，以支持变宽和变高字体。我前些时候把一个 `TFont` 创建器加进了 [usenti](http://www.coranac.com/projects/#usenti)，这样我就能从标准字体轻松生成这些东西，但你也可以从零开始自己做。

`TSurface` 结构体实际上与文本无关。相反，它是一个描述我们所渲染到的表面种类的结构体。这可以是位图、图块、图块映射（tilemap）或其他任何东西。Tonclib 有处理这些表面的基本像素、直线和矩形例程，所以我不如干脆用它们。

```c{#cd-tte-types}
//# From tonc_tte.h : main TTE types.

typedef struct TFont
{
    const void  *data;      //!< Character data.
    const u8    *widths;    //!< Width table for variable width font.
    const u8    *heights;   //!< Height table for variable height font (mostly unused).
    u16 charOffset;         //!< Character offset
    u16 charCount;          //!< Number of characters in font.
    u8  charW;              //!< Character width (fwf).
    u8  charH;              //!< Character height.(fhf).
    u8  cellW;              //!< Glyph cell width.
    u8  cellH;              //!< Glyph cell height.
    u16 cellSize;           //!< Cell-size (bytes).
    u8  bpp;                //!< Font bitdepth;
    u8  extra;              //!< Padding. Free to use.
} TFont;

//! TTE context struct.
typedef struct TTC
{
    // Members for renderers
    TSurface dst;           //!< Destination surface.
    s16 cursorX;            //!< Cursor X-coord.
    s16 cursorY;            //!< Cursor Y-coord.
    TFont *font;            //!< Current font.
    u8  *charLut;           //!< Character mapping lut, if any.
    u16 cattr[4];           //!< ink, shadow, paper and special color attributes.
    // Higher-up members
    u16 reserved;
    u16 ctrl;               //!< BG control flags.
    u16 marginLeft;
    u16 marginTop;
    u16 marginRight;
    u16 marginBottom;
    s16 savedX;
    s16 savedY;
    // Callbacks and table pointers
    fnDrawg  drawgProc;         //!< Glyph render procedure.
    fnErase  eraseProc;         //!< Text eraser procedure.
    const TFont **fontTable;    //!< Pointer to font table for
    const char  **stringTable;  //!< Pointer to string table for
} TTC;
```

```c{#cd-tte-types2}
//# Supporting types

//! Glyph render function format.
typedef void (*fnDrawg)(int);

//! Erase rectangle function format.
typedef void (*fnErase)(int left, int top, int right, int bottom);

typedef struct TSurface
{
    u8  *data;          //!< Surface data pointer.
    u32 pitch;          //!< Scanline pitch in bytes.
    u16 width;          //!< Image width in pixels.
    u16 height;         //!< Image width in pixels.
    u8  bpp;            //!< Bits per pixel.
    u8  type;           //!< Surface type.
    u16 palSize;        //!< Number of colors.
    u16 *palData;       //!< Pointer to palette.
} TSurface;
```

#### TFont 细节

<div class="cpt_fr" style="width:128px;">
  <img src="img/tte/verdana9.png" id="fig:img-verdana9" width="128" alt="">
  <br>
  <b>{*@fig:img-verdana9}</b>: Verdana 9 字符表
</div>

{\*@fig:img-verdana9} 展示了一个 `TFont` 可以使用的字符表。该表是 <dfn>单元格</dfn>（cell）的一个矩阵，每个单元格包含一个字符。`cellW/H` 成员是这些单元格的尺寸；`cellSize` 是每个单元格的字节数。

每个单元格有一个字形，但实际字形可以比单元格小（白色与洋红色部分）。这确实会浪费一点内存，但也有几个好处。好处之一是你可以使用 `cellSize` 快速找到任意给定字形的地址。其次，因为我希望我的字体能同时用于位图和图块，我的字形框无论如何都必须是 8 的倍数。此外，这种特定字体将是 1bpp，意味着即使有浪费的部分，我仍然会有非常低的内存占用（3.5kB）。

对于定宽或定高字体，成员 `charW` 和 `charH` 表示实际的字符宽度和高度。对于变宽字体，`widths` 成员指向一个包含字形宽度的字节数组，对 `heights` 也类似。`charOffset` 是数据起始的（ASCII）字符。字体表通常从空格（' '）开始，所以这通常为 32。`charCount` 是字符的数量，当需要将整张表复制到 VRAM（如图块映射的情况）时可以使用。

请注意，`TFont` 中的数据如何使用几乎完全取决于字形渲染器。libtonc 附带的大多数渲染器都期望这种格式：

- 为了节省空间，按 **1 bpp** 位打包。实际上也是为了渲染速度，因为内存读取开销很大。
- 按字形分块（Tiled-by-glyph）。每个字形的数据以每个字形之间 `cellSize` 字节为间隔连续存放。这类似于 1D 对象的工作方式，但有一个重要区别：
- 每个字形中的图块是**列主序**（column-major）的（图块 1 在图块 0 下方）。这与对象相反，对象往往是[行主序](https://en.wikipedia.org/wiki/Row-major_order)（图块 1 在图块 0 右侧）。我将这种格式称为**图块条**（tile-strips）。这个选择背后的原因将在后面给出。

对此有例外，但这里展示的大多数渲染器都会使用这种格式。如果你想制作自己的渲染器，你可以自由使用你认为合适的数据格式。

#### TTC 细节

文本上下文 `TTC` 包含系统中最重要的数据。从顶部开始：表面 `dst`。它定义了我们要渲染到的表面。那里最相关的项是它的内存地址、**pitch**：每条扫描线的字节数。pitch 是一个_非常_重要的参数，实际上比宽度和高度更重要。该表面也有调色板成员，可用于访问其颜色。和 `TFont` 成员很像，这些数据如何使用在很大程度上取决于渲染器。

成员 `cursorX/Y` 用于当前光标位置。`margin` 矩形指明屏幕上哪一部分应用于文本。如果光标超出右边距，它会被移到左边距并下移一行。边距也用于清屏和返回页面顶部。

`cattr` 表是特殊的。它的条目是<dfn>颜色属性</dfn>（color attribute）。前景色（ink，即文字颜色）、阴影（shadow）、背景色（paper）的参数放在这里，外加一个非常依赖上下文的‘特殊’（special）字段。注意，这些颜色属性不一定表示颜色。在模式 3 和 5 中它们是颜色，但对于模式 4 和图块写入器，它们是颜色索引。可能有个比‘颜色属性’更好的名字，但 sodomy non sapiens（此处为原文俚语，意为懒得多想）。

通过回调 `drawgProc` 和 `eraseProc` 来渲染字形和擦除（部分的）屏幕。思路是你用适合自己文本格式的程序初始化系统，TTE 用它们来做实际写入。我应该指出，为渲染单个字形使用回调会带来显著的开销，特别是对于像图块映射这种较简单的文本。

### TTE 的主要变量和函数 {#ssec-design-writer}

TTE 系统的状态保存在可通过 `tte_get_context()` 访问的 `TTC` 变量中。对系统的所有更改都通过它进行。在某些_情况下_，拥有两套状态并在适当时候切换是有用的（比如当你有两个屏幕时。你好啊，NDS）。为此你可以使用 `tte_set_context)` 来重定向指针。

```c {#cd-ttc-funcs}
TTC __tte_main_context;
TTC *gp_tte_context= &__tte_main_context;

//! Get the master text-system.
INLINE TTC *tte_get_context()
{   return gp_tte_context;                          }


//! Set the master context pointer.
void tte_set_context(TTC *tc)
{
    gp_tte_context= tc ? tc : &__tte_main_context;
}
```

要打印字符，你可以使用 `tte_putc()` 和 `tte_write()`。

```c {#cd-tte-putc}
//! Get the glyph index of character \a ch.
INLINE uint tte_get_glyph_id(int ch)
{
    TTC *tc= tte_get_context();
    ch -= tc->font->charOffset;
    return tc->charLut ? tc->charLut[ch] : ch;
}

//! Get the width of glyph \a id.
INLINE uint tte_get_glyph_width(uint gid)
{
    TFont *font= tte_get_context()->font;
    return font->widths ? font->widths[gid] : font->charW;
}

//! Render a character.
int tte_putc(int ch)
{
    TTC *tc= tte_get_context();
    TFont *font= tc->font;

    // (4) translate from character to glyph index
    uint gid= tte_get_glyph_id(ch);

    // (5) get width for cursor update
    int charW= tte_get_glyph_width(gid);

    if(tc->cursorX+charW > tc->marginRight)
        [[ simulate newline ]]

    // (6) Draw and update position
    tc->drawgProc(gid);
    tc->cursorX += charW;

    return charW;
}
```

```c {#cd-tte-write}
//! Render a string.
/*! \param text String to parse and write.
    \return     Number of parsed characters.
*/
int tte_write(const char *text)
{
    int ch;
    uint gid, charW;
    const char *str= text;
    TTC *tc= tte_get_context();

    while( (ch= *str++) != '\0' )
    {
        // (1) Act according to character type
        switch(ch)
        {
        case '\n':  [[ update cursorX/Y for newline ]];     break;
        case '\t':  [[ update cursorX for tab ]];           break;
        default:
            // (2) more special thingies
            if(ch=='#' && str[0]=='{')          // (2a) Command sequence
            {
                str= tte_cmd_default(str+1);
                break;
            }
            else if(ch=='\\' && str[0]=='#')    // (2b) Escaped command
                ch= *str++;
            else if(ch>=0x80)                   // (2c) UTF8 character
                ch= utf8_decode_char(str-1, &str);

            // (3) draw character
            tte_putc(ch);
        }
    }

    return str - text;
}
```

这里我省略了若干东西的代码，思路应该很清楚。首先，读一个字符。然后，检查它是否是特殊字符（换行、制表符、格式化命令），如果是，则相应处理。因为 `tte_write()` 支持 UTF-8，我们也要检查它并解码字符串以获得完整的 UFT-8 字符。完成这些之后，我们把字符传给 `tte_putc()`，它把字符转换为字形索引，绘制字形并推进光标。

注意：这里描述的方法是_一种_做事方式；它不是_唯一的_方法，因为唯一的方法实际上并不存在。这里做的若干步骤对于你心目中的文本可能属于过度设计。例如，从字符到字形索引的转换是通过字体的字符偏移和可能的字符查找表完成的，两者都不是严格必需的。同样，边缘换行可能已经通过字符串本身的换行符完成了。另一方面，你可能想要更复杂的换行、文本对齐、滚动等等。如果你想要这些东西，创建自己的例程应该不太难。

### 关于命名 {#ssec-design-names}

TTE 中我使用的一些术语有非常特定的含义。由于术语之间的差异可能很微妙，明确界定术语很重要。此外，TTE 使用了几个需要澄清的首字母缩写和缩写。

- **字符（char/character）vs 字形索引（glyph index）**。‘字符’指 ASCII 字符；‘字形索引’是字体中对应的索引。例如，‘A’是字符 65，但如果字体从空格（' '，ASCII 32）开始，‘A’的字形索引就是 65−32=33。作为规则，名为 `ch` 的变量是字符，`gid` 表示字形索引。渲染器的输入是字形索引，而不是字符。

- **表面（Surface）**。表面是我用来描述用来显示文本的任何被操作对象的术语。这通常是 VRAM，但也可以是其他东西，比如用于对象文本的 OBJ_ATTR。

- **Pitch**。Pitch 其实是图形学中的常见术语，但既然图形学术语可能并不那么常见，值得重复一遍。从技术上讲，<dfn>pitch</dfn> 是行之间的扫描线数量。我把它稍微扩展为表示矩阵的_特征主距离_（characteristic major distance）。矩阵是二维实体，它们在一个方向上相邻元素距离近，而在另一个方向上距离大。通常分别是 _x_ 和 _y_，但不总是。_次要_距离将被称为 <dfn>stride</dfn>（步幅）。

- **颜色 vs 颜色属性**。‘颜色’是真正的 5.5.5 BGR 颜色；‘颜色属性’是渲染器将在表面上使用的任何东西。它可以是颜色，但也可以是调色板索引或完全不同的东西。解释权在渲染器。

- **Render/Text 族（family）**。这是针对特定文本的概念性组名。{\*@tbl:tte-family} 给出了可用族的概览。这在很大程度上对应于 `TSurface` 类型。

- **渲染器类型（Renderer types）**。在每个族内部，针对不同的字体和效果可以有不同渲染器。例如，当渲染到 8bpp 位图（bmp8 族）时，你可以为不同的字体位深（比如 1bpp 或 8bpp）或字形布局（位图化或分块）使用不同渲染器。它们可以将某些像素渲染为透明，或应用抗锯齿。或者这些的任何组合。重点是这里选项_很多_。

  因为我真的不喜欢占满整行的名字，我会在渲染器名字中使用缩写来表明它的作用；这些缩写的含义见 {@tbl:tte-drawg}。在大多数情况下，渲染器将用于任意宽度和高度的字体，采用 1bpp 的图块条（tile-stripped）字形，并将它们以透明方式绘制并对像素重新着色。这由 `*_b1cts` 表示。

<div class="lblock">
  <table id="tbl:tte-family" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:tte-family}</b>: TTE 渲染族指示符与初始化函数。4bpp 图块可以是行主序或列主序（<code>crh4r</code> 或 <code>chr4c</code>）。
    </caption>
    <tr>
      <th width=25%>族（Family）</th>	
      <th>前缀（prefix）</th> 
      <th>初始化函数（Initializer）</th>		
    </tr>
    <tr>
	    <td>常规图块映射（模式 0/1）</td>	
      <td>se</td>
	    <td>
        void tte_init_se(int bgnr, u16 bgcnt, SCR_ENTRY se0, u32 colors, u32 bupofs, const TFont *font, fnDrawg proc);
      </td>
    </tr>
    <tr>
	    <td>仿射图块映射（模式 1/2）</td>
      <td>ase</td>
	    <td>
        void tte_init_ase(int bgnr, u16 bgcnt, u8 ase0, u32 colors, u32 bupofs, const TFont *font, fnDrawg proc);
      </td>
    </tr>
    <tr>
	    <td>4bpp 图块（模式 0/1/obj）</td>	
      <td>chr4<i>(c/r)</i></td>
	    <td>
        void tte_init_chr4<i>(c/r)</i>(int bgnr, u16 bgcnt, u32 cattrs, u32 colors, const TFont *font, fnDrawg proc);
      </td>
    </tr>
    <tr>
	    <td>8bpp 位图（模式 4）</td>
      <td>bmp8</td>
	    <td>
        void tte_init_bmp(int vmode, const TFont *font, fnDrawg proc);
      </td>
    </tr>
    <tr>
	    <td>16bpp 位图（模式 3/5）</td>
      <td>bmp16</td>
	    <td>void tte_init_bmp(int vmode, const TFont *font, fnDrawg proc);</td>
    </tr>
    <tr>
	    <td>对象（objects）</td>
      <td>obj</td>
	    <td>
        void tte_init_obj(OBJ_ATTR *dst, u32 attr0, u32 attr1, u32 attr2, u32 colors, u32 bupofs, const TFont *font, fnDrawg proc);
      </td>
    </tr>
  </table>
</div>
<br>
<div class="lblock">
  <table id="tbl:tte-drawg" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:tte-drawg}</b>: 渲染类型摘要。
    </caption>
    <tr>
      <th>代码（Code）</th>
      <th>描述（Description）</th>
    </tr>
    <tr>
      <td>b<i>x</i></td>
      <td><b>位</b>深（bitdepth）的源字体。（<code>b1</code> = 1 bpp）</td>
    </tr>
    <tr>
      <td>w<i>x</i></td>
      <td>特定的<strong>宽</strong>度（<code>w8</code> = 宽 8）</td>
    </tr>
    <tr>
      <td>h<i>x</i></td>
      <td>特定的<strong>高</strong>度（<code>h8</code> = 高 8）</td>
    </tr>
    <tr>
      <td>c</td>
      <td>
        重新<strong>着</strong>色（re-<b>c</b>oloring）。颜色属性以某种方式应用到像素上。
      </td>
    </tr>
    <tr>
      <td>t/o</td>
      <td><strong>透</strong>明（<b>T</b>ransparent）或<strong>不</strong>透明（<b>o</b>paque）的背景像素。</td>
    </tr>
    <tr>
      <td>s</td>
      <td>字形采用图块<strong>条</strong>（tile-<b>s</b>trip）格式。</td>
    </tr>
  </table>
</div>

最后，关于我在渲染代码中使用的一些缩写的说明。一些术语会反复出现，我已经习惯用简写记号表示这些项。基本格式是 `fooX`，其中 `foo` 是相关的位图/表面，`X` 是表示宽度、高度、数据等事物的单字母代码。是的，使用单字母名字不受待见，我也一般不提倡这样用，但我发现，在这个特定情况下，如果使用得当，它们确实帮我读懂了自己的代码。

<div class="lblock">
  <table id="tbl:tte-brevs" class="table-data">
    <caption align="bottom">
       <b>{*@tbl:tte-brevs}</b>: 渲染代码中使用的缩写。
    </caption>
    <tr> 
      <th>术语（Term）</th>
      <th>含义（Meaning）</th>
    </tr>
    <tr>
      <td><code>fooW</code></td>
      <td><code>foo</code> 的宽度</td>
    </tr>
    <tr>
      <td><code>fooH</code></td>
      <td><code>foo</code> 的高度</td>
    </tr>
    <tr>
      <td><code>fooB</code></td>
      <td><code>foo</code> 的位深</td>
    </tr>
    <tr>
      <td><code>fooP</code></td>
      <td><code>foo</code> 的 pitch</td>
    </tr>
    <tr>
      <td><code>fooD</code></td>
      <td><code>foo</code> 的主数据指针</td>
    </tr>
    <tr>
      <td><code>fooL</code></td>
      <td><code>foo</code> 的次级数据指针</td>
    </tr>
    <tr>
      <td><code>fooS</code></td>
      <td><code>foo</code> 的大小</td>
    </tr>
    <tr>
      <td><code>fooN</code></td>
      <td><code>foo</code> 的数量/计数</td>
    </tr>
  </table>
</div>

## 图块映射文本 {#sec-map}

### 常规图块映射文本 {#ssec-map-reg}

图块映射文本最容易实现，因为你其实不必渲染任何东西。你只需把字体的所有图块载入一个字符块（charblock），并为实际文本放置屏幕条目（screen-entry）。

常规图块映射的初始化函数是 `tte_init_se()`。它与 [`txt_init_se()`](text.html#cd-txt-init-se) 完全相同，除了末尾多了两个参数：`font` 和 `proc`。它们分别表示要使用的字体和负责表面操作的渲染器。TTE 中的每个初始化函数都有这两个参数。如果你不确定用什么，可以安全地把它们传 NULL；那样会使用该族的默认选项。

如果 `font` 是 NULL，你会得到默认字体。对于定宽场合，这是 [`system8Font`](text.html#img-tonc-font)；当变宽合适时，这是 `verdana9Font`（{@fig:img-verdana9}）。它们也可以分别通过 `fwf_default` 和 `vwf_default` 引用。

每个族也有一个默认渲染器，定义为 _`foo`_`_drawg_default`，其中 _foo_ 是族前缀。默认渲染器是通用例程，适用于所有字符宽度和高度（定宽或变宽字体）。当然，这确实意味着它们会比针对特定字形大小编写的例程慢。对于图块映射文本尤其如此，因此那里也提供了特定的 `_w8h8` 和 `_w8h16` 版本。

初始化函数往往又长又无聊，所以我不会在这里浪费太多篇幅。基本上，它们清空文本上下文，给边距和表面变量赋予合理的值，设置字体、渲染器和擦除器。它们还填充一些调色板和颜色属性。

本章展示的代码将主要是关于渲染器本身。下面你可以看到默认屏幕条目写入器 `se_drawg_s()` 的代码，以及专门针对 8×8 字体的 `se_drawg_w8h8`

```c {#cd-se-drawg .proglist}
//! Character-plot for reg BGs, any sized, vertically tiled font.
void se_drawg_s(uint gid)
{
    int ix, iy;

    // (1) Get main variables.
    TTC *tc= tte_get_context();
    TFont *font= tc->font;
    uint charW= (font->cellW+7)/8, charH= (font->cellH+7)/8;

    uint x0= tc->cursorX, y0= tc->cursorY;
    uint dstP= tc->dst.pitch/2;
    u16 *dstD= (u16*)(tc->data + (y0*dstP+x0)*2);

    // (2) Get the base tile index.
    u32 se= tc->cattr[TTE_SPECIAL] + gid*charW*charH;

    // (3) Loop over all tiles to draw glyph.
    for(ix=0; ix<charW; ix++)
    {
        for(iy=0; iy<charH; iy++)
            dstD[iy*dstP]= se++;
        dstD++;
    }
}

//! Character-plot for reg BGs using an 8x8 font.
void se_drawg_w8h8(uint gid)
{
    TTC *tc= tte_get_context();

    uint x0= tc->cursorX, y0= tc->cursorY;
    uint dstP= tc->dst.pitch/2;
    u16 *dstD= (u16*)(tc->data + (y0*dstP+x0)*2);

    dstD[0]= tc->cattr[TTE_SPECIAL] + gid;
}
```

让我们从更简单的一个开始：`se_drawg_w8h8()`。GBA 图块映射上的一个 8×8 字形，简单地意味着向正确的位置写入一个屏幕条目。这里的正确位置由光标位置和表面数据（`tc->dst`）推导而来。‘特殊’颜色属性用作字形索引的修饰符，用于调色板切换之类的事情。

注意，该例程只处理字形绘制。从 ASCII 到字形索引的转换以及光标的重新定位都在别处完成。

更通用的例程 `se_drawg_s()` 稍微复杂一点。它仍然以获得到字形目标的指针 `dstD` 和 pitch（到下一行的距离）`dstP` 开始。**所有**渲染器都以类似方式开始。所有渲染器也检索字符的宽度和高度——除非尺寸是预先指定的。我用于渲染的名字始终相同，所以即使初始化它们的公式可能有点讨厌，你也应该能分辨出各自的含义。

总之，在拿到指针和 pitch 之后，计算出字形左上角的图块索引，并放入 `se`。之后，我们在两个方向上遍历字形的各个图块。注意循环顺序是列主序而非行主序，因为默认字体就是那样排序的。

碰巧的是，列主序渲染往往对文本更高效，因为字形通常比它们高比宽。同时，对于图块映射文本，`charW` 和 `charH` 往往很小——通常是 1 或 2。这意味着使用循环极其低效；我们在[“分析渲染器性能”小节](#ssec-misc-profile)中就会看到究竟有多低效。像 `se_drawg_w8h8()` 和 `se_drawg_w8h16()` 那样把它们展开，会带来好得多的性能。

### 常规图块映射示例 {#ssec-test-se4}

```c {#cd-test-se4 .proglist}
void test_tte_se4()
{
    irq_init(NULL);
    irq_add(II_VBLANK, NULL);
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0;

    // --- (1) Base TTE init for tilemaps ---
    tte_init_se(
        0,                      // Background number (BG 0)
        BG_CBB(0)|BG_SBB(31),   // BG control (for REG_BGxCNT)
        0,                      // Tile offset (special cattr)
        CLR_YELLOW,             // Ink color
        14,                     // BitUnpack offset (on-pixel = 15)
        NULL,                   // Default font (sys8)
        NULL);                  // Default renderer (se_drawg_s)

    // --- (2) Init some colors ---
    pal_bg_bank[1][15]= CLR_RED;
    pal_bg_bank[2][15]= CLR_GREEN;
    pal_bg_bank[3][15]= CLR_BLUE;
    pal_bg_bank[4][15]= CLR_WHITE;
    pal_bg_bank[5][15]= CLR_MAG;

    pal_bg_bank[4][14]= CLR_GRAY;

    // --- (3) Print some text ---

    // "Hello world in different colors"
    tte_write("\n Hello world! in yellow\n");
    tte_write(" #{cx:0x1000}Hello world! in red\n");
    tte_write(" #{cx:0x2000}Hello world! in green\n");

    // Color use explained
    tte_set_pos(8, 64);
    tte_write("#{cx:0x0000}C#{cx:0x1000}o#{cx:0x2000}l");
    tte_write("#{cx:0x3000}o#{cx:0x4000}r#{cx:0x5000}s");
    tte_write("#{cx:0} provided by \\#{cx:#}.");

    // --- (4) Init for 8x16 font and print something ---
    GRIT_CPY(&tile_mem[0][256], cyber16Glyphs); // Load tiles
    tte_set_font(&cyber16Font);                 // Attach font
    tte_set_special(0x4100);                    // Set special to tile 256, pal 4
    tte_set_drawg(se_drawg_w8h16);              // Attach renderer

    tte_write("#{P:8,80}Also available in 8x16");

    key_wait_till_hit(KEY_ANY);
}
```

上面的代码演示了你可以对图块映射使用 TTE 做的几件事。对 `tte_init_se()` 的调用把系统初始化为在 BG 0 上显示文本，使用字符块 0 和屏幕块 31，并使用默认字体和渲染器。第五个参数是位解包偏移（bit-unpack offset）；把它设为 14，字体中所有值为 1 的像素就会移到 14+1=15，即调色板 bank 中的最后一个索引。我还设置了几种其他颜色，使调色板看起来像 {@fig:img-test-se4}b。

在第 3 步，我用 `tte_write()` 打印一些文本。不同的颜色是通过在字符串中使用 `#{cx:`_`num`_`}` 实现的，它会把特殊颜色属性设为 _num_。关于这类命令的更多内容见[“脚本、控制台 IO 和其他便利功能”一节](#sec-misc)。由于 `se` 渲染器把这个值加到字形索引上作为最终输出，它可以用于调色板切换。

第 4 步演示了如何加载并使用第二种字体。`cyber16Font` 是经典 SNES 游戏 Cybernator 中使用的 8×16 字体的一个再现（见 {@fig:img-cyber16}）。这个字体被导出为 4bpp 数据，所以我可以直接把它复制到 VRAM，但我确实需要使用一个偏移，因为我想保留旧字体。字符块现在有两套字形（见 {@fig:img-test-se4}c）。

<div class="cblock">
  <table width=60%>
    <tr valign="bottom">
      <td>
	      <div class="cpt_fl" style="width:128px;">
	        <img src="img/tte/cyber16.png" id="fig:img-cyber16" alt="Cybernator 字体：8&times;16。">
          <br>
	        <b>{*@fig:img-cyber16}</b>: Cybernator 字体：8&times;16。
	      </div>
      </td>
      <td>
	      <div class="cpt" style="width:240px;">
	        <img src="img/tte/test_tte_se4.png" id="fig:img-test-se4" alt="test_tte_se4 输出">
          <br>
	        <b>{*@fig:img-test-se4}a</b>: <code>test_tte_se4</code> 输出。
	      </div>
      </td>
    </tr>
    <tr valign="top">
      <td>
	      <div class="cpt" style="width:128px;">
	        <img src="img/tte/tte_se4_pal.png" alt="调色板（<code>test_tte_se4</code>）。">
          <br>
	        <b>{*@fig:img-test-se4}b</b>: 调色板。
	      </div>
      </td>
      <td>
	      <div class="cpt" style="width:256px;">
	        <img src="img/tte/tte_se4_tiles.png" alt="<code>test_tte_se4</code> 的 VRAM 图块。">
          <br>
	        <b>{*@fig:img-test-se4}c</b>: 图块集。
	      </div>
      </td>
    </tr>
  </table>
</div>

原则上，使用不同字体我所需做的就是用 `tte_set_font()` 选择它，但由于图块处于偏移位置，我还需要调整特殊颜色属性。这里使用值 0x4100 来考虑偏移（0x0100）和调色板 bank（0x4000）。我还为这个场合选择了另一种渲染器，尽管这里主要是为了展示，因为默认渲染器同样能处理 8×16 字体。之后，我只需再次调用 `tte_write()` 用新字体打印一个新字符串。

### 仿射图块映射文本 {#ssec-map-affine}

仿射图块映射的文本与常规图块映射几乎一样；你只需记住两种背景之间的差异，比如地图大小和可用位深。函数的原型相同，只是 `se` 被 `ase` 替换。

在内部，唯一的真正区别是渲染器要输出什么，即字节而非半字（halfword）。这里我们再次遇到 VRAM 那个古怪的小事实：你不能向 VRAM 写入单个字节。这意味着渲染器会稍微复杂一点。但也只是稍微：只需为屏幕条目放置调用一个字节绘制例程。因为仿射地图本质上是 8bpp 位图表面，我可以使用 8bpp 位图表面的标准绘制器：`_sbmp8_plot()`。除了这一处差异，`ase_` 渲染器与 `se_` 对应物相同。

```c {#cd-ase-drawg .proglist}

//! Character-plot for affine BGs using an 8x8 font.
void ase_drawg_w8h8(uint gid)
{
    TTC *tc= tte_get_context();
    u8 se= tc->cattr[TTE_SPECIAL] + gid;

    _sbmp8_plot(&tc->dst, tc->cursorX/8, tc->cursorY/8, se);
}

//! Character-plot for affine BGs, any sized, vertically oriented font.
void ase_drawg_s(int gid)
{
    TTC *tc= tte_get_context();
    TFont *font= tc->font;
    uint charW= (font->cellW+7)/8, charH= (font->cellH+7)/8;
    uint x0= tc->cursorX/8, y0= tc->cursorY/8;

    u8 se= tc->cattr[TTE_SPECIAL] + gid*charW*charH;

    int ix, iy;
    for(ix=0; ix<charW; ix++)
        for(iy=0; iy<charH; iy++, se++)
            _sbmp8_plot(&tc->dst, ix+x0, iy+y0, se);
}
```

仿射地图文本的演示是 `text_tte_ase()`。这里的思路很简单：为一个 256×256 像素的地图设置文本，把一些文本写上去，并旋转背景以说明它确实是一个仿射背景。旋转中心是屏幕中央的‘o’。要把它放在那里，我使用了 `#{P:x,y}` 代码；这把光标设为 (x, y) 给定的绝对位置。另一个字符串也以这种方式放置在地图上。

```c {#cd-test-ase .proglist}
void test_tte_ase()
{
    irq_init(NULL);
    irq_add(II_VBLANK, NULL);
    REG_DISPCNT= DCNT_MODE1 | DCNT_BG2;

    // Init affine text for 32x32t bg
    tte_init_ase(
        2,                      // BG number
        BG_CBB(0) | BG_SBB(28) | BG_AFF_32x32,  // BG control
        0,                      // Tile offset (special cattr)
        CLR_YELLOW,             // Ink color
        0xFE,                   // BUP offset (on-pixel = 255)
        NULL,                  // Default font (sys8)
        NULL);                  // Default renderer (ase_drawg_s)

    // Write something
    tte_write("#{P:120,80}o");
    tte_write("#{P:72,104}Round, round, #{P:80,112}round we go");

    // Rotate it
    AFF_SRC_EX asx= { 124<<8, 84<<8, 120, 80, 0x100, 0x100, 0 };
    bg_rotscale_ex(&REG_BG_AFFINE[2], &asx);

    while(1)
    {
        VBlankIntrWait();
        key_poll();

        asx.alpha += 0x111;
        bg_rotscale_ex(&REG_BG_AFFINE[2], &asx);

        if(key_hit(KEY_START))
            break;
    }
}
```

<div class="cpt" style="width:240px;">
  <img src="img/tte/test_tte_ase.png" id="fig:img-test-ase"
    alt="<code>test_tte_ase</code>。"><br>
  <b>{*@fig:img-test-ase}</b>: <code>test_tte_ase</code>。
</div>

## 位图文本 {#sec-bmp}

位图文本渲染与地图文本略有不同，根据需求难度可以从简单到疯狂不等。不过其核心始终是同一个过程：遍历所有像素并把它们画到目标表面。例如，一个透明地绘制像素的通用字形渲染器可能看起来像这样。

```c {.proglist}
// Pseudo code for a general glyph printer.
void foo_drawg(uint gid)
{
    TTC *tc= tte_get_context();
    TFont *font= tc->font;

    // Drawing with color keying.
    // Loop over all pixels. If the glyph's pixel is not zero, draw it.
    // Other wise, nevermind.
    for(iy=0; iy<tte_get_glyph_height(gid); iy++)
    {
        for(ix=0; ix<tte_get_glyph_width(gid); ix++)
        {
            u16 color= font_get_pixel(font, gid, ix, iy);
            if(color != 0)
                foo_plot(&tc->dst, tc->cursorX+ix, tc->cursorY+iy, color);
        }
    }
}
```

这里，_`foo`_ 可以表示任何渲染族。`foo_plot()` 是通用的像素绘制器，`font_get_pixel()` 是像素读取器。这些函数的实现取决于字体和表面的具体细节，但字形渲染器不需要知道这些。

### 基本的 bmp16 到 bmp16 字形打印器 {#ssec-bmp16-base}

下一个函数是一个把 16bpp 字体打印到 16bpp 位图的例子。

```c {#cd-bmp16-drawg .proglist}
//! Glyph renderer from bmp16 glyph to bmp16 destination.
void bmp16_drawg(uint gid)
{
    // (1a) Basic variables
    TTC *tc= tte_get_context();
    TFont *font= tc->font;

    u16 *srcD= (u16*)(font->data+gid*font->cellSize), *srcL= srcD;
    uint charW= tte_get_glyph_width(gid)
    uint charH= tte_get_glyph_height(gid);

    uint x0= tc->cursorX, y0= tc->cursorY;
    uint srcP= font->cellW, dstP= tc->dst.pitch/2;
    u16 *dstD= (u16*)(tc->dst.data + (y0*dstP + x0)*2);

    // (2) The actual rendering
    uint ix, iy;
    for(iy=0; iy<charH; iy++)
    {
        for(ix=0; ix<charW; ix++)
            if(srcD[ix] != 0)
                dstD[ix]= srcD[ix];

        srcD += srcP;
        dstD += dstP;
    }
}
```

块 1a 和 1b 设置了循环中要使用的主要变量。最重要的是源和目标指针 `srcD` 和 `dstD`，以及它们的 pitch `srcP` 和 `dstP`。注意源 pitch `srcP` 不是字符宽度，而是单元格宽度，因为字体是按单元格网格组织的。第 2 点的代码有选择地把像素从字体复制到表面。

#### 插曲：关于性能的考量

你可能会想，为什么 `bmp16_drawg()` 没有更贴近前面 `foo_drawg()` 的模式。答案当然是性能。在有人拿 Knuth 的话来怼我之前：并非每次让代码变快的努力都是过早优化。当你能在不花太多力气、也不损失可读性的情况下提高代码速度时，没有太多理由不去这么做。

在这种情况下，我在这里应用的优化分为两类：局部变量和指针算术。这些——每个 C 程序员_都_应该知道的——技术把速度提升了 5 倍。

从指针开始。我在这里两处利用指针为自己谋利。首先，我没有直接使用字体数据指针和目标指针，而是创建了指针 `srcD` 和 `dstD`，并把它们指向字形左上角和将被渲染到的位置。像这样短路访问意味着我不必在循环中施加额外偏移就能到达想去的地方。这既更快，实际上也更具可读性，因为循环里不会含有任何非必要表达式。

```c {.proglist}
//# Example of a more standard bitmap copier.
for(iy=0; iy < charH; iy++)
    for(ix=0; ix < charW; ix++)
        dstD[iy*dstP + ix]= srcD[iy*srcP+ix];
```

第二点是使用增量偏移而非 `y*pitch+x` 形式（见上）。我想这主要是一个偏好问题，但避免完全不必要的乘法确实重要。

第二个优化是局部变量。我的意思是将驻留在内存中的变量（全局变量和结构成员）或频繁使用的函数结果载入局部临时变量。这看起来像是要指出的蠢事，但你用这种方式能节省的时间其实相当高。

考虑这里 `tte_get_glyph_width()` 的用法。我_知道_字形宽度在循环中不会改变，所以在循环条件本身里调用函数来获取宽度简直蠢。另一个例子是在遍历字符串中所有字符时调用 `strlen()`。对这么做的人：不！坏程序员，坏！把值保存在局部变量里，改用它。

另一点是，如果你多次使用全局变量和结构/类成员，就预先载入它们。考虑下面的代码。它和前面给出的相同，只是现在我还没有把字符高度和 pitch 载入局部临时变量。

```c {.proglist}
//# Another bitmap-copy example. DO NOT USE THIS !!!
for(iy=0; iy < font->charH; iy++)
    for(ix=0; ix < charW; ix++)
        dstD[iy*tc->dst.pitch/2 + ix]= srcD[iy*font->cellW + ix];
```

结果：函数速度被**减半**！我预期它会变慢，但这个看似无害的修改居然让我付出了两倍代价，着实让我吃惊。

所以是的，对你的循环不变量、基于内存的量，尽管用局部变量填充代码。这避免了它们每次都从内存载入。作为额外好处，循环本身会包含更少的文本而更具通用性，从而更可复用。

指针运算和预载入变量其实都是编译器优化器的工作，但当前版本的 GCC 做得不好，或者根本不做。而且有时它_不能_做这种优化。当内存解引用之间调用了函数时，编译器不得不重新加载数据，因为那些函数可能改变了其内容。显然，对于局部变量这不会发生。

:::tip 用局部变量保存结构成员和全局变量

结构成员和全局变量存在于内存中，而非 CPU 寄存器。在 CPU 能使用它们的数据之前，必须先把它们从内存载入寄存器，而这往往发生的次数比必要的多。由于内存访问（尤其是 ROM 访问）比寄存器访问慢，如果某东西被使用超过一次，这真的会拖慢算法。你可以通过为它们创建局部变量来避免这种无用功。

除了提速，局部变量可以使用更短的名字，从而在实际工作的部分得到更短、更可读的代码。简直是双倍胜利，宝贝。

:::

### 字形与表面格式 {#ssec-srf-format}

上面描述的渲染器假设字形被格式化为 16-bpp 位图。然而，TTE 的默认字体是 1-bpp 图块条（tile-strip）格式，所以我得用别的东西。在深入这个函数的细节之前，我想讨论不同的字形格式，以及为什么我使用图块条而不是普通位图。

当我说字形格式时，我真正指的是像素被访问的顺序。存在三个关键变体。

- **线性**（Linear）或**位图**（bitmap）布局。这是一个简单的行主序矩阵。这给你两个循环；一个给 _y_，一个给 _x_。
- **分块**（Tiled）。特别是：8×8 分块。这是标准 GBA 图块格式，其中每 8×8 像素的一组形成一个行主序矩阵，然后这些图块本身再次是一个更大的行主序矩阵的一部分。遍历这个需要**四个**循环：每个矩阵两个。
- **图块条**（Tile-strips）。这也使用 8×8 图块，但这次图块按列主序排列。换句话说，图块 1 在图块 0 下方，而不是右侧。这有一个相当不错的性质：连续图块中的行是连续的。它消除了 _y_ 方向上的断裂，结果只有 3 个循环，而且代码更简单。

{\*@fig:img-src-loops} 展示了这三种布局，包括循环结构和 1bpp 字体中像素被遍历的顺序。情况由于位打包而略有不同：1 bpp 意味着每字节 8 个像素。结果，位图 _x_ 循环必须被打断为 8 个一组，所以位图格式现在使用三层嵌套循环而不是两层。对于分块格式没有区别，因为它们本来就按 8 个像素分组。不仅如此，如果你去计算常用字形大小的总循环开销，你会发现这种排列实际上对图块条特别好。这作为练习留给读者（提示：数一数比较的次数）。

<div class="cblock">
  <div class="cpt" style="width:600px;">
    <img src="img/tte/src_loops.png" id="fig:img-src-loops" width=600 alt="位图、图块和图块条格式中字形的像素遍历。">
    <br>
    <b>{*@fig:img-src-loops}</b>: 1-bpp 位图、图块和图块条格式中字形的像素遍历。数字表示循环及其嵌套。
  </div>
</div>

### bmp16_drawg_b1cts：1 到 16 bpp，带透明与着色 {#ssec-bmp16-std}

下一个例程接收 1-bpp 图块条字形，并把它们转换为适合 16-bpp 位图背景的输出。输出将使用 ink 属性作为颜色，并且只有在源数据中该位为 1 时才绘制像素，从而实现透明。顶部的三个宏声明并定义了基本变量，与 `bmp16_drawg()` 中的第 1a 步类似。

<pre><code class="language-c hljs">
void bmp16_drawg_b1cts(uint gid)
{
    // (1) Basic variables
    TTE_BASE_VARS(tc, font);
    TTE_CHAR_VARS(font, gid, <span class="bold">u8</span>, srcD, srcL, charW, charH);
    TTE_DST_VARS(tc, <span class="bold">u16</span>, dstD, dstL, dstP, x0, y0);
    uint srcP= font-&gt;cellH;

    dstD += x0;

    u32 ink= tc-&gt;cattr[TTE_INK], raw;

    // (2) Rendering loops.
    uint ix, iy, iw;
    for(iw=0; iw&lt;charW; iw += 8)            // loop over tile-strips
    {
        dstL= &amp;dstD[iw];
        for(iy=0; iy&lt;charH; iy++)           // loop over tile-lines
        {
            raw= srcL[iy];
            for(ix=0; raw&gt;0; raw&gt;&gt;=1, ix++) // loop over tile-scanline (8 pixels)
                if(raw&amp;1)
                    dstL[ix]= ink;

            dstL += dstP/2;
        }
        srcL += srcP;
    }
}
</code></pre>

该例程以对三个宏的调用开始：`TTE_CHAR_VARS()`、`TTE_CHAR_VARS` 和 `TTE_DST_VARS()`。它们声明并定义了大多数相关的局部变量，类似于 `bmp16_drawg()` 中的第 1a 步。注意这里的两个参数是源和目标指针的数据类型标识符。开始时 `srcD` 和 `srcL` 会指向源数据的开头。其他指针 `dstD` 和 `dstL` 指向目标区域中_扫描线_的起点。它们还没有针对 _x_ 位置做修正；这正是紧随其后的事情。

这里我使用两对指针（一个主_数据_指针 `fooD` 和一个_行_指针 `fooL`）的原因，是指针算术。数据指针保持固定，行指针在内层循环中移动。

{\*@fig:img-src-loops} 的图块条部分说明了该例程如何遍历所有像素。因为它用于 1-bpp 位打包字体，并且每个图块行有 8 个像素，我们可以用一次字节读取得到一整行的像素。透明渲染也给了我们一个很好的优化机会：如果图块行是空的（即 `raw`==0），我们就没有更多可见像素在该行，可以移动到下一行。看一眼 {@fig:img-verdana9} 中的 verdana 9 字体，你会明白由于这个原因你可能可以跳过 50% 的像素。

### bmp8_drawg_b1cts：1 到 8 bpp，带透明与着色 {#ssec-bmp8-std}

上一函数的 8 bpp 对应物叫做 `bmp8_drawg_b1cts()`，如下给出。代码与 16 bpp 函数非常相似，但由于像素现在是字节，细节上有一些区别。

<pre><code class="language-c hljs">void bmp8_drawg_b1cts(uint gid)
{
    // <span class="bold">(1)</span> Basic variables
    TTE_BASE_VARS(tc, font);
    TTE_CHAR_VARS(font, gid, u8, srcD, srcL, charW, charH);
    TTE_DST_VARS(tc, u16, dstD, dstL, dstP, x0, y0);
    uint srcP= font-&gt;cellH;

    dstD += x0/2;

    u32 ink= tc-&gt;cattr[TTE_INK], raw, px;
    uint odd= x0&amp;1;                         // <span class="bold">(2)</span> Source offset.

    uint ix, iy, iw;
    for(iw=0; iw&lt;charW; iw += 8)            // Loop over strips.
    {
        dstL= &amp;dstD[iw/2];
        for(iy=0; iy&lt;charH; iy++)           // Loop over lines.
        {
            raw= srcL[iy]&lt;&lt;odd;             // <span class="bold">(3)</span> Apply source offset.
            for(ix=0; raw&gt;0; raw&gt;&gt;=2, ix++) // Loop over pixels.
            {
                // <span class="bold">(4)</span> 2-bit -> 2-byte unpack, then used as masks.
                px= ( (raw&amp;3)&lt;&lt;7 | (raw&amp;3) ) &amp;~ 0xFE;
                dstL[ix]= (dstL[ix]&amp;~(px*255)) + ink*px;
            }
            dstL += dstP/2;
        }
        srcL += srcP;
    }
}

</code></pre>

与 `bmp16_drawg_b1cts` 唯一真正的区别在于最内层循环。VRAM 不可写字节的问题意味着我们需要一次写入两个像素。为此，我取出两个位并解包成两个字节，用它们创建新像素和像素掩码。内层循环的第一行做解包。它把位模式 _`ab`_ 转换成 `0000 000`_`a`_` 0000 000`_`b`_`。这个半字中的两个字节现在都是 0 或 1，取决于 _a_ 和 _b_ 是开还是关。通过乘以 `ink` 和 255，你可以得到着色像素和用于插入的适当掩码。

<pre><code class="language-sh hljs"># 2-bit to 2-byte unpacking.
0000 0000  hgfe dcb<b>a</b>    p  = raw (start)
0000 0000  0000 00<span class="rem">b<b>a</b></span>    p &amp;= 3
0000 000<span class="rem"><b>b</b>  a</span>000 00b<b>a</b>    p |= p&lt;&lt;7;
0000 000<b>b</b>  0000 000<b>a</b>    p &amp;= ~0xFE;
</code></pre>

准备好正确的半字只是工作的一部分。如果 `cursorX`（即 `x0`）是奇数，那么字形也应该被绘制到一个奇数的起始位置。然而，目标指针 `dstL` 是半字指针，这些必须总是半字对齐的。为了处理这个，注意把模式‘`abcd efgh`’解包到奇数边界，等价于把‘`a bcde fgh`**`0`**’解包到偶数边界。这正是额外按 `odd` 移位的目的。

### 示例：子像素渲染 {#ssec-bmp-demo}

对于本节的演示，我想用一种叫做[<dfn>子像素渲染</dfn>](https://en.wikipedia.org/wiki/Subpixel_rendering)的技术。这是一种通过‘借用’其他像素的颜色来有效三倍化水平渲染分辨率的方法。

考虑 {@fig:img-subpx}a 中所示的字母‘A’。如你所知，每个像素由三种颜色组成：红、绿、蓝。这些是子像素。子像素网格上的字母看起来像 {@fig:img-subpx}b。注意颜色仍然按像素分组，这在子像素网格上给出了非常锯齿状的边缘。子像素渲染的技巧是左右移动子像素组，从而得到更平滑的边缘（{@fig:img-subpx}c）。现在再次把像素组合成 RGB 颜色得到 {@fig:img-subpx}d。像在 {@fig:img-subpx} 中那样放大后，子像素渲染可能看起来不怎么样，但在适当大小使用时效果会相当惊人。

<div class="cblock">
  <div class="cpt" style="width:576px;">
    <img src="img/tte/subpx.png" id="fig:img-subpx" alt="子像素渲染。左图：">
    <br>
    <b>{*@fig:img-subpx}</b>: 子像素渲染。
    <b>a</b>: 8&times;8 网格上的‘A’。
    <b>b</b>: 同上，在 R、G、B 子网格上。
    <b>c</b>：移动行以均匀分布子像素。
    <b>d</b>：像素中新的颜色分布（黑/白反转）。
  </div>
</div>

子像素渲染并非对一切都管用。因为它稍微混淆了像素和颜色的概念，它只适用于灰度图像。这当然使它非常适合文本。其次，子像素的排列顺序也很重要。**{@fig:img-subpx}** 所示的过程适用于 RGB 排列的屏幕，但当像素是 BGR 排列时会相当惨烈地失败。深入所有肮脏细节在这里篇幅太多，所以我让你参考 [http://www.grc.com/ctwhat.htm](https://www.grc.com/ctwhat.htm)，它更详细地解释了这一概念并给了几个例子。

<div class="cpt_fr" style="width:128px;">
  <img src="img/tte/yesh1.png" id="fig:img-yesh" width=128 alt="4&times;8 子像素字体">
  <br>
  <b>{*@fig:img-yesh}</b>: 4&times;8 子像素字体
</div>

JanoS ([http://www.haluz.org/yesh/](http://www.haluz.org/yesh/)) 为 GBA 和 NDS 创建了一个不错的 4×8 子像素字体（见 {@fig:img-yesh}）。宽度 4 真的很小；用常规渲染不可能有那种大小的字形还能保持文本可读。然而用子像素渲染，它看起来仍然不错，现在你可以在屏幕上容纳比平时多得多的字符。

演示的输出可以在 {@fig:img-test-bmp16} 看到。因为子像素渲染与你所观看的硬件紧密相连，在大多数屏幕或纸张上它可能看起来很糟。你真的得在 GBA 屏幕上才能看到完整效果。

在这个特定情况下，我把字体转换成了能与 `bmp16_drawg()` 配合使用的格式：一个位图布局的 16bpp 字体。创建一个 8 位版本也不会很难。当然，1-bpp 位打包字体是不可能的，因为该字体有超过两种颜色。要让子像素字体看起来正确，你实际上需要很多颜色：R、G、B 的每种组合，以及各自的明暗变化。话虽如此，JanoS 在不损失太多质量的情况下把颜色数量减少到了 20。如果有人想要，我也有一个 15 色的版本用于 4bpp 字体。

```c {#cd-tte-test-bmp16 .proglist}
//! Testing a bitmap renderer with JanoS' sub-pixel font.
void test_tte_bmp16()
{
    irq_init(NULL);
    irq_add(II_VBLANK, NULL);
    REG_DISPCNT= DCNT_MODE3 | DCNT_BG2;

    tte_init_bmp(3, &yesh1Font, bmp16_drawg);
    tte_init_con();

    const char *str=
    "https://en.wikipedia.org/wiki/Subpixel_rendering :\n"
    "Subpixel rendering is a way to increase the "
    "apparent \nresolution of a computer's liquid crystal "
    "display (LCD).\nIt takes advantage of the fact that "
    "each pixel on a color\nLCD is actually composed of "
    "individual red, green, and\nblue subpixel stripes to "
    "anti-alias text with greater\ndetail.\n\n"
    "  4x8 sub-pixel font by JanoS.\n"
    "  http://www.haluz.org/yesh/\n";

    tte_write(str);
    key_wait_till_hit(KEY_ANY);
}
```

<div class="lblock">
  <div class="cpt" style="width:240px;">
    <img src="img/tte/test_tte_bmp16.png" id="fig:img-test-bmp16" alt="子像素渲染演示">
    <br>
    <b>{*@fig:img-test-bmp16}</b>: 子像素渲染演示
  </div>
</div>

## 对象文本 {#sec-obj}

对象文本在你希望字符稍微移动一下，或者你背景上实在没有空间时很有用。对象文本有几种可能。最明显的一种是把所有字符载入对象 VRAM，并把对象的图块索引设为使用正确的图块。这就是 TTE 对象系统所用的方式。

在许多方面，这种对象文本类似于图块映射文本。图块是预先载入的，你改变相关的映射条目（在这里是对象的 `attr2`）到正确的编号。当然，也有一些显著差异。

其一，字符的位置必须写入对象。但不仅如此，对象还需要知道它们应该多大，以及是否有任何其它有趣的属性，比如旋转和调色板。因此，我选择使用颜色属性 0、1 和 2 来存储对象属性 0、1 和 2。

另一个问题是用哪些对象以及用多少。最后一个实际上可能带来大问题，因为你也可能想用对象做普通精灵，如果它们突然被文本系统覆盖，那会是个很糟糕的主意。

对于后一个问题，我使用（或者也许是滥用）上下文的 `dst` 成员。每个字形由一个对象表示，所以我需要一个对象数组，但我用了一点小技巧。我将从数组的_末尾_开始，这样较低的对象仍能像平常一样用于精灵。本质上，我把 OAM 当作一个空降序栈来用。在这种安排中，`dst.data` 指向栈顶（即数组中的最后一个元素），`dst.pitch` 是当前对象的索引，`dst.width` 是栈的长度。

对象的默认绘制器是 `obj_drawg`。记住，`dst.pitch` 在这里用作索引，`dst.data` 是栈顶，所以用一个_负_索引来获取当前对象。之后，坐标和正确的字形索引与颜色属性合并，创建最终的对象。

```c {#cd-obj-drawg .proglist}
//! Glyph-plotter using objects.
void obj_drawg(uint gid)
{
    TTC *tc= tte_get_context();
    TFont *font= tc->font;
    uint x0= tc->cursorX, y0= tc->cursorY;

    // (1) find the right object, and increment index.
    uint id= tc->dst.pitch;
    OBJ_ATTR *obj= &((OBJ_ATTR*)tc->dst.data)[-id];
    tc->dst.pitch= (id+1 < tc->dst.width ? id+1 : 0);

    // (2) Set object attributes.
    obj->attr0= tc->cattr[0] + (y0 & ATTR0_Y_MASK);
    obj->attr1= tc->cattr[1] + (x0 & ATTR1_X_MASK);
    obj->attr2= tc->cattr[2] + gid*font->cellW*font->cellH/64;
}
```

而且，我知道这种 `dst` 成员的用法有点……不正统；但它在这里反正没被用到，所以为什么不呢。我正考虑用更规范一点的东西，但还不是现在。另外，记住这个系统假定字体已经载入 VRAM，而这会占用_很多_可用图块。使用 verdana 9 字体的话，那将是 2\*240 = 480 个图块。几乎是对象 VRAM 的一半。更安全的替代方案是动态载入所需图块，但那需要更多资源管理。

:::warning TTE 的对象文本很丑

TTE 中处理对象文本的方式能工作，但实现并不怎么漂亮。我在这里使用 `TTC.dst` 的方式，嗯，很糟。我很可能会稍后清理一下，或者至少把实现隐藏得更好。

:::

### 示例：字母。沿路径 {#ssec-obj-demo}

对象的定义是它们与背景分离；它们可以在屏幕上独立移动。对象文本最有可能用于动态文本，或者必须沿某种路径移动。在这种情况下，我会让它们沿着一个参数化路径飞行，叫做 [Lissajous 曲线](https://en.wikipedia.org/wiki/Lissajous_curve)（见 {@fig:img-test-obj}）。

<div class="cpt_fr" style="width:240px;">
  <img src="img/tte/test_tte_obj.png" id="fig:img-test-obj" alt="沿路径的对象文本。">
  <br>
  <b>{*@fig:img-test-obj}</b>: 沿路径的对象文本。
</div>

代码在下面给出。在初始化了惯常的嫌疑人之后，调用 `tte_init_obj()`。对象栈从 OAM 的末尾开始，如果第一个参数传 NULL，这也是系统默认的做法。接下来三个是对象属性。因为我想用默认的变宽字体 verdana 9，属性应设为 8×16 对象。图块的位深总是 4，以把所用图块数量控制在限度内。初始化的其余部分应该容易理解。

字符串本身的制作在第 2 步完成。注意字符串还把背景颜色属性（对应 obj.attr2）设为 0x1000 以让‘omg’变红。这几行之后，文本处理本身就完成了。

在第 3 步，计算路径上的坐标。`t` 参数指示我们沿路径走了多远。它用于计算每一个字母的坐标——第一个使用 `t` 本身，其余本质上是时间延迟的。别被那些魔数分了神：它们取值的唯一原因就是让效果看起来还行。试着稍微调整它们，看看它们究竟做什么。

```c {#cd-test-obj .proglist}
// Object text demo
void test_tte_obj()
{
    // Base inits
    irq_init(NULL);
    irq_add(II_VBLANK, NULL);
    REG_DISPCNT= DCNT_MODE0 | DCNT_OBJ | DCNT_OBJ_1D;
    oam_init(oam_mem, 128);
    VBlankIntrWait();

    // (1) Init object text, using verdana 9 (8x16 objects)
    OBJ_ATTR *objs= &oam_mem[127];
    tte_init_obj(
        objs,               // Start at back of OAM
        ATTR0_TALL,         // attr0: 8x16 objects
        ATTR1_SIZE_8,       // attr1: 8x16 objects
        0,                  // attr2: nothing special
        CLR_YELLOW,         // Yellow ink
        0x0E,               // ink pixel 14+1 = 15
        &vwf_default,          // Verdana 9 font
        NULL);              // Default renderer (obj_drawg)

    pal_obj_bank[1][15]= CLR_RED;

    // (2) Write something (and prep for path)
    const char *str= "Parametrized object text, omg!!!";
    const int len= strlen(str);
    tte_write("Parametrized object text, #{cp:0x1000}omg#{cp:0}!!!");

    // Play with the objects
    int ii, t= 0x9000;
    while(1)
    {
        VBlankIntrWait();
        key_poll();

        // (3) Make lissajous figure
        for(ii=0; ii<len; ii++)
        {
            int ti= t-0x380*ii;             // Get the path param for letter ii
            obj_set_pos(&objs[-ii],
                (96*lu_cos(  ti)>>12)+120,  // y= Ay*cos(  t) + y0
                (64*lu_sin(2*ti)>>12)+80);  // x= Ax*sin(2*t) + x0
        }
        t += 0x00A0;

        if(key_hit(KEY_START))
            break;
    }
}
```

## 渲染到图块 {#sec-chr}

用图块映射做文本不错，但只有在字形尺寸是 8 的倍数时才有效。在可读性方面有几个缺点：‘i’这样的窄字符会显得要么过宽，要么被许多空白像素包围。而且，因为图块数量有限，一行放不下很多字符。

变宽字体（<dfn>vwf</dfn>；也称比例字体）解决了这个问题。在位图上使用变宽字体相当容易，如[“位图文本”一节](#sec-bmp)所示。然而，在图块映射模式中使用它要棘手一点：你怎么在图块为 8×8 大小的图块映射上绘制？

嗯，你不直接那么做。不完全是。关键不是绘制到地图，而是绘制到地图所显示的图块上。

### 基本图块渲染 {#ssec-chr-base}

使用图块映射的通常方式是载入一个图块集（tileset），然后通过填充图块映射来选择你想在屏幕上显示的那一些。在那些情况下，图块集往往是静态的，地图被更新用于滚动之类的事情。渲染到图块颠倒了这个流程。

首先，你需要搭建一个地图，其中每个条目指向一个唯一图块。这本质上用图块构成了一个图形表面，然后你可以像对其他表面一样绘制到它上面。最明显的方法是简单地用连续数字填满屏幕块（见 {@fig:img-chr4-map}a）。然而，更好地映射图块的方式是按列主序映射图块（见 {@fig:img-chr4-map}b），理由与我选择它作为字形格式相同：一列图块中的字是连续的。

<div class="cblock" id="fig:img-chr4-map">
  <table border=0 cellpadding=4 cellspacing=0 width=70%>
    <tr>
      <td>
        <img src="img/tte/chr4r_map.png" alt="">
        <b>{*@fig:img-chr4-map}a</b>. 行主序图块索引。
      </td>
      <td>
        <img src="img/tte/chr4c_map.png" alt="">
        <b>{*@fig:img-chr4-map}b</b>. 列主序图块索引。
      </td>
    </tr>
  </table>
</div>

准备地图是容易的部分；问题是要知道编辑哪个图块的哪一部分来绘制一个像素。首先，你需要把坐标拆成图块坐标和图块内像素坐标。这分别相当于除以 8 和模 8。注意在列主序模式下，你只需对 _x_ 坐标做这个。有了这些信息，你可以找到正确的字。水平的图块内坐标告诉你更新字中的哪个 nybble，此时就是通常的位域插入。

Tonclib 有用于绘制到 4bpp 列主序图块（称为 <dfn>chr4c</dfn> 模式）的例程。绘制器和地图准备函数在下面给出，还有一个演示例程来解释它们的用法。

```c {#cd-chr4c-test .proglist}
//# From tonc_schr4c.c

//! Plot a pixel on a 4bpp tiled, column-major surface.
void schr4c_plot(const TSurface *dst, int x, int y, u32 clr)
{
    uint xx= x;     // fluff to make x unsigned.
    u32 *dstD= (u32*)(dst->data + xx/8*dst->pitch);
    uint shift= xx%8*4;

    dstD[y] = (dstD[y] &~ (15<<shift)) | (clr&15)<<shift;
}

//! Prepare a screen-entry map for use with chr4c mode.
void schr4c_prep_map(const TSurface *srf, u16 *map, u16 se0)
{
    uint ix, iy;
    uint mapW= srf->width/8, mapH= srf->height/8, mapP= srf->pitch/32;

    for(iy=0; iy<mapH; iy++)
        for(ix=0; ix<mapW; ix++)
            map[iy*32+ix]= ix*mapP + iy + se0;
}

//# --- Simple test ---------------------------------------------------

void test_chr4()
{
    // (1) The usual
    irq_init(NULL);
    irq_add(II_VBLANK, NULL);
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0;
    REG_BG0CNT= BG_CBB(0) | BG_SBB(31);

    pal_bg_mem[1]= CLR_RED;
    pal_bg_mem[2]= CLR_GREEN;
    pal_bg_mem[3]= CLR_BLUE;
    pal_bg_mem[4]= CLR_WHITE;

    // (2) Define a surface
    TSurface srf;
    srf_init(&srf,
        SRF_CHR4C,          // Surface type.
        tile_mem[0],        // Destination tiles.
        SCREEN_WIDTH,       // Surface width.
        SCREEN_HEIGHT,      // Surface height.
        4,                  // Bitdepth (ignored due to SRF_CHR4C).
        pal_bg_mem);        // Palette.

    // (3) Prepare the map
    schr4c_prep_map(&srf, se_mem[31], 0);

    // (4) Plot some things
    int ii, ix, iy;
    for(iy=0; iy<20; iy++)
        for(ix=0; ix<20; ix++)
            schr4c_plot(&srf, ix+3, iy+11, 4);

    for(ii=0; ii<20; ii++)
    {
        schr4c_plot(&srf, ii+4,    12, 1);  // Red line
        schr4c_plot(&srf, ii+4, ii+12, 2);  // Green line
        schr4c_plot(&srf,    4, ii+12, 3);  // Blue line
    }
}
```

像素绘制器首先找到目标像素所在的图块列。列索引简单地是 _x_/8；乘以 pitch 得到指向列顶部的指针。注意 pitch 的用法与平时略有不同。通常它表示到下一扫描线的字节数，但在这里它被用作到下一个图块列的字节偏移。对于列主序模式，这归结为 *height*×*bpp*\*8/8，但这些都在 `srf_init()` 里完成了。一旦有了正确的图块，你想要的像素就在第 _x_%8<sup>th</sup> 个 nybble 中，意味着插入所需的移位是 _x_%8\*4。之后，只需插入颜色即可。<span class="mini">（好奇的话：我先把 _x_ 转换成无符号 int，因为这样除法和模运算会被正确地优化成移位/掩码。）</span>

`schr4c_prep_map()` 函数只是按 {@fig:img-chr4-map}b 中给出的顺序初始化地图。嗯，差不多。我还像通常对调色板和图块偏移那样，给每个屏幕条目加上一个值。

`test_chr4()` 的输出可以在 {@fig:img-chr4-test}a 看到。如预期，它是一个带有红、绿、蓝线条的白色矩形。{\*@fig:img-chr4-test}b 是从 VBA 的图块查看器截取的图，展示了表面的内容。看起来和屏幕上的不太一样，是吧？不过，如果你仔细看，你能弄清楚它怎么工作。每组 20 个图块在屏幕上构成一个图块列（以黄色块标示）。当你把这些图块叠在一起时，就会看到 {@fig:img-chr4-test}a 的图片浮现。

<div class="cblock">
  <table width=60% id="fig:img-chr4-test">
    <tr valign="top">
      <td>
	      <div class="cpt" style="width:80px;">
	        <img src="img/tte/chr4_test.png" alt="chr4_test 的输出">
          <br>
	        <b>{*@fig:img-chr4-test}a</b>: chr4_test() 输出
	      </div>
      </td>
      <td>
	      <div class="cpt" style="width:289px;">
	        <img src="img/tte/chr4_test_tiles.png" alt="chr4_test 的输出">
          <br>
	        <b>{*@fig:img-chr4-test}b</b>: chr4_test() 的图块。黄色块标示属于同一列的图块。
	      </div>
      </td>
    </tr>
  </table>
</div>

### 图块上的文本渲染 {#ssec-chr-drawg}

#### 版本 1：逐像素

渲染字形到图块最简单的方式是遵循[“位图文本”一节](#sec-bmp)的模板。这是在下面的函数中完成的。

```c {#cd-chr4-drawg-b1cts-a .proglist}
//! Simple version of chr4 renderer.
void chr4_drawg_b1cts_base(uint gid)
{
    TTE_BASE_VARS(tc, font);
    TTE_CHAR_VARS(font, gid, u8, srcD, srcL, charW, charH);
    uint x0= tc->cursorX, y0= tc->cursorY;
    uint srcP= font->cellH;

    u32 ink= tc->cattr[TTE_INK], raw;

    uint ix, iy, iw;
    for(iw=0; iw<charW; iw += 8)
    {
        for(iy=0; iy<charH; iy++)
        {
            raw= srcD[iy];
            for(ix=0; raw>0; raw>>=1, ix++)
                if(raw&1)
                    schr4c_plot(&tc->dst, x0+ix, y0+iy, ink);
        }
        srcD += srcP;
        x0 += 8;
    }
}
```

现在，你可能认为由于 `schr4c_plot()` 中所有的重复计算，这运行得相当慢。你是对的，但事实上，它没我最初想的那么糟。通过简单地内联，是有可能加速的，但真正的收益来自并行绘制像素。

#### 版本 2：一次 8 像素

与其逐个绘制像素，你也可以同时绘制多个像素。我们之前看到的 `bmp8_drawg_b1cts()` 渲染器就是这样做的：它解包 2 个像素并一起绘制。在 4bpp 图块的情况下，你可以把源字节解包成一个（32 位）字，并一次绘制_八_个像素。唯一的缺点是你可能得把它分到两个图块上。

下一个函数是 TTE 用于图块的主要字形渲染器，它是个大家伙。内层循环中渲染有两个阶段：解包源字节 `raw`，以及把准备好的像素 `px` 拆分到相邻的图块上。它们分别对应第 3 步和第 4 步。

通常，位解包是在循环中完成的，但有时用其他方式做更快。细节见我关于[位技巧](https://www.coranac.com/documents/bittrick/#sec-bup)的文档。第 3 步的前五行做解包。例如，它把二进制 `0001 1011` 变成十六进制 `0x00011011`。然后乘以 15 和 `ink`，分别给出像素掩码 `pxmask` 和着色像素 `px`。

第 4 步在必要时把带像素的字分配到两个图块上。在第 1 步，准备了左移和右移来提供这个过程的位偏移。现在，对于更大的字形，这意味着某些目标字会被使用两次，但这没办法（其实可以，但过程很丑而且可能不值得）。另一种做法是使用目标一次，并读取（以及解包/着色）源两次；然而，由于 VRAM 比 ROM 快得多，我怀疑这会更有利。

<pre><code class="language-c hljs">//! Render 1bpp fonts to 4bpp tiles; col-major order.
void chr4c_drawg_b1cts(uint gid)
{
    // Base variables.
    TTE_BASE_VARS(tc, font);
    TTE_CHAR_VARS(font, gid, u8, srcD, srcL, charW, charH);
    uint x= tc-&gt;cursorX, y= tc-&gt;cursorY, dstP= tc-&gt;dst.pitch/4;
    uint srcP= font-&gt;cellH;

    // <span class="bold">(1)</span> Prepare dst pointers and shifts.
    u32 *dstD= (u32*)(tc-&gt;dst.data + (y + x/8*dstP)*4), *dstL;
    x %= 8;
    uint lsl= 4*x, lsr= 32-4*x, right= x+charW;

    // Inner loop vars.
    u32 px, pxmask, raw;
    u32 ink= tc-&gt;cattr[TTE_INK];
    const u32 mask= 0x01010101;

    uint iy, iw;
    for(iw=0; iw&lt;charW; iw += 8)    // Loop over strips
    {
        // <span class="bold">(2)</span> Update and increment main data pointers.
        srcL= srcD;     srcD += srcP;
        dstL= dstD;     dstD += dstP;

        for(iy=0; iy&lt;charH; iy++)   // Loop over scanlines
        {
            raw= *srcL++;
            if(raw)
            {
                // <span class="bold">(3)</span> Unpack 8 bits into 8 nybbles and create the mask
                raw |= raw&lt;&lt;12;
                raw |= raw&lt;&lt;6;
                px   = raw &amp; mask&lt;&lt;1;
                raw &amp;= mask;
                px   = raw | px&lt;&lt;3;

                pxmask= px*15;
                px   *= ink;

                // <span class="bold">(4a)</span> Write left tile:
                dstL[0] = (dstL[0] &amp;~ (pxmask&lt;&lt;lsl) ) | (px&lt;&lt;lsl);

                // <span class="bold">(4b)</span> Write right tile (if any)
                if(right &gt; 8)
                    dstL[dstP]= (dstL[dstP] &amp;~ (pxmask&gt;&gt;lsr) ) | (px&gt;&gt;lsr);
            }
            dstL++;
        }
    }
}
</code></pre>

`chr4c_drawg_b1cts()` 相当快。它肯定比早期版本快约 33%。它实际上甚至比 bmp8 渲染器还快，但只是微弱优势。

当然，你总能更上一层楼。各种移位和条件判断使它非常适合 ARM 代码，而非 Thumb。而且为确保它完全按计划进行，我用汇编来做。

#### 版本 3：ARM 汇编

下一个函数是 `chr4_drawg_b1cts_fast()`，即版本 2 的 ARM 汇编等价物。C 循环和 asm 循环几乎是一一对应的，所以请参考 C 版本了解说明。

就速度而言，asm 版本比 C 版本_好得多_。即使在 ROM 中——这对 ARM 代码_非常_不利——它仍然比 Thumb 版本快。有一两个小小的细节可以再加速它，但大体上对于任意尺寸的字体这就应该是它了。当然，如果你的字体尺寸固定，并且不需要重新着色或透明，情况会略有不同。

```armasm {#cd-chr4c-drawg-b1cts-fast .proglist}
// Include TTC/TFont member offsets plz.
#include "tte_types.s"

/*
IWRAM_CODE void chr4c_drawg_b1cts_fast(int gid);
*/
    .section .iwram, "ax", %progbits
    .arm
    .align
    .global chr4c_drawg_b1cts_fast
chr4c_drawg_b1cts_fast:
    stmfd   sp!, {r4-r11, lr}

    ldr     r5,=gp_tte_context
    ldr     r5, [r5]

    @ Preload dstBase (r4), dstPitch (ip), yx (r6), font (r7)
    ldmia   r5, {r4, ip}
    add     r3, r5, #TTC_cursorX
    ldmia   r3, {r6, r7}

    @ Get srcD (r1), width (r11), charH (r2)
    ldmia   r7, {r1, r3}            @ Load data, widths
    cmp     r3, #0
    ldrneb  r11, [r3, r0]           @ Var charW
    ldreqb  r11, [r7, #TF_charW]    @ Fixed charW
    ldrh    r3, [r7, #TF_cellS]
    mla     r1, r3, r0, r1          @ srcL
    ldrb    r2, [r7, #TF_charH]     @ charH
    ldrb    r10, [r7, #TF_cellH]    @ cellH

    @ Positional issues: dstD(r0), lsl(r8), lsr(r9), right(lr), cursorX
    mov     r3, r6, lsr #16         @ y
    bic     r6, r6, r3, lsl #16     @ x

    add     r0, r4, r3, lsl #2      @ dstD= dstBase + y*4
    mov     r3, r6, lsr #3
    mla     r0, ip, r3, r0

    and     r6, r6, #7              @ x%7
    add     lr, r11, r6             @ right= width + x%8
    mov     r8, r6, lsl #2          @ lsl = x%8*4
    rsb     r9, r8, #32             @ lsr = 32-x%8*4

    ldr     r6,=0x01010101
    ldrh    r7, [r5, #TTC_ink]

    @ --- Reg-list for strip/render loop ---
    @ r0    dstL
    @ r1    srcL
    @ r2    scanline looper
    @ r3    raw
    @ r4    px / tmp
    @ r5    pxmask
    @ r6    bitmask
    @ r7    ink
    @ r8    left shift
    @ r9    right shift
    @ r10   dstD
    @ r11   charW
    @ ip    dstP
    @ lr    split indicator (right edge)
    @ sp00  charH
    @ sp04  deltaS = cellH-charH     (delta srcL)

    cmp     r11, #8
    @ Prep for single-strip render
    suble   sp, sp, #8
    ble     .Lyloop
    @ Prep for multi-strip render
    sub     r3, r10, r2
    mov     r10, r0
    stmfd   sp!, {r2, r3}           @ Store charH, deltaS
    b       .Lyloop

    @ --- Strip loop ---
.Lsloop:
        @ (2) Update and increment main data pointers.
        ldmia   sp, {r2, r3}        @ Reload charH and deltaS
        add     r10, r10, ip        @ (Re)set dstD/dstL
        mov     r0, r10
        add     r1, r1, r3
        sub     lr, lr, #8

        @ --- Render loop ---
.Lyloop:
            @ (3) Prep px and pxmask
            ldrb    r3, [r1], #1
            orrs    r3, r3, r3, lsl #12
            beq     .Lnopx              @ Skip if no pixels
            orr     r3, r3, r3, lsl #6
            and     r4, r3, r6, lsl #1
            and     r3, r3, r6
            orr     r3, r3, r4, lsl #3

            rsb     r5, r3, r3, lsl #4
            mul     r4, r3, r7

            @ (4a) Render to left tile
            ldr     r3, [r0]
            bic     r3, r3, r5, lsl r8
            orr     r3, r3, r4, lsl r8
            str     r3, [r0]

            @ (4b) Render to right tile
            cmp     lr, #8
            ldrgt   r3, [r0, ip]
            bicgt   r3, r3, r5, lsr r9
            orrgt   r3, r3, r4, lsr r9
            strgt   r3, [r0, ip]
.Lnopx:
            add     r0, r0, #4
            subs    r2, r2, #1
            bne     .Lyloop

        @ Test for strip loop
        subs    r11, r11, #8
        bgt     .Lsloop

    add     sp, sp, #8
    ldmfd   sp!, {r4-r11, lr}
    bx      lr

@ EOF
```

### 多色与带阴影的字体 {#ssec-chr4-drawg-b4}

位打包字体会给你单色字形。如果你想要更多颜色——用于阴影或抗锯齿——你需要使用更多位。这里的代码与 1bpp 位打包版本几乎相同；最重要的区别是不同的源数据类型和寻找正确掩码的替代方法。哦，当然，你不再需要解包位了。

下面的片段展示了如何从一个 8 个 4 位像素的字创建透明掩码。本质上，你把 nybble 的所有位做掩码，并屏蔽掉该 nybble 的其他位。如果整个 nybble 为空，得到 0；否则得到 1。然后这又乘以 15 给出适当的掩码。

```c {.proglist}
// Create pixel mask from 8x 4 bits
u32 *srcL= ...;         // Source is now 32bit.

raw     = *srcL++;      // Source word: 8x 4 bits
pxmask  = raw;
pxmask |= pxmask>>2;    // bit0 = bit0 | bit2
pxmask |= pxmask>>1;    // bit0 = bit0 | bit1 | bit2 | bit3;
pxmask &= 0x11111111;   // bit0 is 0 only if bits 0-3 were all 0
pxmask *= 15;
```

<div class="cpt_fr" style="width:128px;">
  <img src="img/tte/verdana9_b4.png" id="fig:img-verdana9-b4" width="128" alt="">
  <br>
  <b>{*@fig:img-verdana9-b4}</b>: Verdana 9，带阴影。
</div>

#### 带阴影的字符

不，不是阴*郁*（shad*y*）的字符；是带阴*影*（shad*ed*）的字符。你常在游戏中看到的是文本一侧有轮廓或一点阴影。虽然有可能用 1bpp 字体创建阴影，但更简单的是直接把它构建进字体本身（见 {@fig:img-verdana9-b4}）。因为这意味着比 1bpp 能处理的颜色更多，你可能会想在这里使用 2bpp 字体。然而，除非你真的_非常_缺内存，用 4bpp 在这里同样更方便。

到那时，你可以遵循前面描述的流程。但通过巧妙地利用构成阴影的位，你也可以让阴影颜色可变。例如，你可以指定位 0 为‘ink’位，位 1 为‘shadow’位，必要时位 2 为‘paper’位。那么 `raw&0x11111111` 给出‘ink’掩码，`(raw>>1)&0x11111111` 给出‘shadow’掩码；然后它们可以用于应用颜色并创建完整掩码。下面是一个如何做的演示。注意这里的每一行正好对应一条 ARM 指令，所以这应该是高效的方法。嗯，在 ARM 代码里是这样的。

```c {.proglist}
// Use bits 0 and 1 from each nybble to create masks and apply colors.
u32 *srcL= ...;

raw     = *srcL++;              // Source word: 8x 4 bits
px      = raw    & 0x11111111;  // Bit 0 for ink pixels
raw     = raw>>1 & 0x11111111;  // Bit 1 for shadow pixels
pxmask  = px | raw;             // Mask of ink and shadow bits
pxmask *= 15;

px      = px * ink;             // Color with ink
px     += raw* shadow;          // Add shadow pixels
```

`chr4c_drawg_b4cts()` 渲染器使用这个方法给 ink 和 shadow 像素都着色。它本质上就是 `chr4c_drawg_b4cts()`，除了加粗部分以及去掉了位解包。还要注意这里的‘无像素’条件。如果 `pxmask` 为零，就无事可做；所以我们不做什么。

<pre><code class="language-c hljs">//! 4bpp font, tilestrips with ink/shadow coloring.
void chr4c_drawg_b4cts(uint gid)
{
    TTE_BASE_VARS(tc, font);
    TTE_CHAR_VARS(font, gid, u32, srcD, srcL, charW, charH);
    uint x= tc-&gt;cursorX, y= tc-&gt;cursorY;
    uint srcP= font-&gt;cellH, dstP= tc-&gt;dst.pitch/4;

    // <span class="bold">(1)</span> Prepare dst pointers and shifts.
    <span class="bold">u32 *dstD= (u32*)(tc-&gt;dst.data + (y+x/8*dstP)*4), *dstL</span>;
    x %= 8;
    uint lsl= 4*x, lsr= 32-4*x, right= x+charW;

    // Inner loop vars
    u32 amask= 0x11111111;
    u32 px, pxmask, raw;
    u32 ink=   tc-&gt;cattr[TTE_INK];
    <span class="bold">u32 shade= tc-&gt;cattr[TTE_SHADOW]</span>;

    uint iy, iw;
    for(iw=0; iw&lt;charW; iw += 8)    // Loop over strips
    {
        srcL= srcD;     srcD += srcP;
        dstL= dstD;     dstD += dstP;

        for(iy=0; iy&lt;charH; iy++)   // Loop over scanlines
        {
            raw= *srcL++;

            // <span class="bold">(3a)</span> Prepare pixel mask
            px    = (raw    &amp; amask);
            raw   = (raw&gt;&gt;1 &amp; amask);
            pxmask= px | raw;
            if(pxmask)
            {
                px *= ink;          // <span class="bold">(3b)</span> Color ink pixels
                px += raw*shade;    // <span class="bold">(3c)</span> Color shadow pixels
                pxmask *= 15;       // <span class="bold">(3d)</span> Create mask

                // <span class="bold">(4a)</span> Write left tile:
                dstL[0] = (dstL[0] &amp;~ (pxmask&lt;&lt;lsl) ) | (px&lt;&lt;lsl);

                // <span class="bold">(4b)</span> Write right tile (if any)
                if(right &gt; 8)
                    dstL[dstP]= (dstL[dstP] &amp;~ (pxmask&gt;&gt;lsr) ) | (px&gt;&gt;lsr);
            }
            dstL++;
        }
    }
}
</code></pre>

### 快速图块渲染的技巧 {#ssec-chr4-tips}

我对这些图块渲染器做了不少性能分析，并认为自己相当了解哪些技术高效、哪些不高效。以下是我的一些观察。

- **分析性能（Profile）**。在想出复杂的例程之前，确保原始的简单版本确实值得优化_而且_聪明的例程确实更快。
- **透明渲染**。现在，你可能会认为这会较慢，但也许不会。透明文本的关键在于前景像素比背景像素少得多，所以要渲染的像素数量也更少。
- **不要缓冲**。我的首次尝试有用于解包/着色和插入 VRAM 的分离阶段。它把准备好的像素放进一个 IWRAM 缓冲区，然后复制到 VRAM。如果我没记错，合并循环并丢开缓冲区为我节省了 30%。
- **并行化**。得到正确数据的路很长。如果你不必走那么多趟，会很有帮助。话虽如此，如果你有很多空像素，一次画 8 个可能是浪费力气。这取决于字体。
- **ARM 代码是 r0xx0rz（极品）**。这些例程中有很多移位、掩码和数量。这使它们特别适合 ARM 代码而非 Thumb。事实上，即使在带有 16 位总线的 ROM 中，ARM 版本也击败了 Thumb 编译的版本。话虽如此……
- **不要让 GCC 在 ARM 中使用常量掩码**。ARM 优化器在处理与字面量（如 0x11111111）做 AND 时有一个不幸的 bug。它不会发出简单的 `ldr`+`and` 对，而是会变聪明，通过把掩码拆成多个字节大小掩码来避免加载。所以内层循环里你不是一条指令，而是四条。可能更多，取决于这占用了多少额外寄存器。注意，这_只_对常量发生，且_只_对 ARM 编译的代码发生。一个变通办法是把掩码放在一个会在循环前载入的全局变量中。这也是我把一些例程手工汇编的部分原因。
- **如果可以，为特殊情况编码**。如果你只有一种字体，并且不需要着色之类的东西，你可以只针对那种情况编码，并可能节省大量时间。对源和目标的尺寸使用常量而非内存中的值也会有点帮助。
- **使用列主序访问**。上面给出的例程需要额外代码才能从一个图块行移动到另一个。如果你以列主序布局使用图块，就不必这么做。

请对这份清单应用标准免责声明。我发现这些技术对我的案例有效，但它们不会适用于每个案例。例如，其他系统（*咳* NDS）会有不同的 CPU 架构和内存特性，那会影响速度。

### 对话框窗口上的彩色文本 {#ssec-chr4-demo}

<div class="cpt_fr" style="width:240px;">
  <img src="img/tte/test_tte_chr4.png" id="fig:img-test-chr4" alt="图块上的文本。">
  <br>
  <b>{*@fig:img-test-chr4}</b>: 图块上的文本。
</div>

{@fig:img-test-chr4} 中描绘的情况应该很熟悉。这里的关键点是有一个背景地图，以及一个里面有文本的对画框。这个文本是静态的，但左上角的位置会随着你沿地图滚动而不断更新。

这个演示的核心函数是 `test_tte_chr4()`。它做的第一件事是调用 `tte_init_chr4c()` 为 chr4c 模式初始化文本系统。第三个参数是地图条目的偏移：`0xF000` 意味着它使用子调色板 15。第四个是颜色属性的字：ink 为 13，shadow 为 15，其余为 0。对于这个演示，我使用 verdana9 的 4bpp 版本（见 {@fig:img-verdana9-b4}）以及快速汇编版本来渲染字形。

第 2 步载入背景地图和对话框。注意对话框被复制到文本渲染到的图块上。当文本被打印时，这会表明字形确实是透明渲染的。这多少意味着我不能使用标准擦除器，因为那也会擦掉对话框。

对话框文本在第 3 步绘制。`ci` 和 `cs` 标签分别设置 ink 和 shadow 颜色属性。这让字符串“arrows”使用颜色 1 和 2（嗯，0xF1 和 0xF2），等等。

<pre><code class="language-c hljs">//! Set up a rectangle for text, with the non-text layers darkened for contrast.
void win_textbox(uint bgnr, int left, int top, int right, int bottom, uint bldy)
{
    REG_WIN0H= left&lt;&lt;8 | right;
    REG_WIN0V=  top&lt;&lt;8 | bottom;
    REG_WIN0CNT= WIN_ALL | WIN_BLD;
    REG_WINOUTCNT= WIN_ALL;
    
    REG_BLDCNT= (BLD_ALL&amp;~BIT(bgnr)) | BLD_BLACK;
    REG_BLDY= bldy;

    REG_DISPCNT |= DCNT_WIN0;

    tte_set_margins(left, top, right, bottom);
}

//! Test chr4 shaded text renderer
void test_tte_chr4()
{
    irq_init(NULL);
    irq_add(II_VBLANK, NULL);
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0 | DCNT_BG2;

    // <span class="bold">(1)</span> Init for text
    tte_init_chr4c(
        0,                              // BG number.
        BG_CBB(0)|BG_SBB(10),           // BG control.
        <span class="bold">0xF000,                         // Screen-entry base
        bytes2word(13,15,0,0),          // Color attributes.</span>
        CLR_BLACK,                      // Ink color
        &amp;verdana9_b4Font,               // Verdana 9, with shade.
        (fnDrawg)chr4c_drawg_b4cts_fast);    // b4cts renderer, asm version
    tte_init_con();                     // Initialize console I/O

    // <span class="bold">(2)</span> Load graphics
    LZ77UnCompVram(dungeon01Map, se_mem[12]);
    LZ77UnCompVram(dungeon01Tiles, tile_mem[2]);
    LZ77UnCompVram(dungeon01Pal, pal_bg_mem);

    GRIT_CPY(&amp;tile_mem[0][16*30], dlgboxTiles);
    GRIT_CPY(pal_bg_bank[15], dlgboxPal);

    // <span class="bold">(3)</span> Create and print to a text box.
    win_textbox(0, 8, 160-32+4, 232, 160-4, 8);
    CSTR text=
        "#{P}Scroll with #{ci:1;cs:2}arrows#{ci:13;cs:15}, "
        "quit with #{ci:1;cs:2}start#{ci:13;cs:15}\n"
        "Box opacity with #{ci:3;cs:4}L/R#{ci:7;cs:9}";
    tte_write(text);

    // Reset margins for coord-printing
    tte_set_margins(8, 8, 232, 20);

    int x=128, y= 32, ey=8&lt;&lt;3;

    REG_BG2HOFS= x;
    REG_BG2VOFS= y;

    // Invisible map buildup!
    REG_BG2CNT= BG_CBB(2) | BG_SBB(12) | BG_REG_64x64;
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0 | DCNT_BG2 | DCNT_WIN0;

    while(1)
    {
        VBlankIntrWait();
        key_poll();
        
        // <span class="bold">(4)</span> Scroll and blend
        x = clamp(x + key_tri_horz(), 0, 512+1-SCREEN_WIDTH);
        y = clamp(y + key_tri_vert(), 0, 512+1-SCREEN_HEIGHT);
        ey= clamp(ey+ key_tri_shoulder(), 0, 0x81);

        REG_BG2HOFS= x;
        REG_BG2VOFS= y;
        REG_BLDY= ey&gt;&gt;3;

        // (5) Erase and print new position.
        tte_printf("#{es;P}%d, %d", x, y);
        
        if(key_hit(KEY_START))
            break;      
    }   
}
</code></pre>

我用一句话结束本节，关于文本框。如果你仔细看，你会看到它是半透明的。或者，准确地说，文本和框本身是正常亮度，但它所覆盖的背景比平常暗。这个漂亮的小效果需要两件事。

- 必须定义内部和外部窗口。两个窗口都应包含所有层，但内部窗口必须设为使用混合（WIN_BLD）。这使混合仅对内部启用。
- 混合模式应设为淡出到黑色（BLD_BLACK），用于除带文本框的背景之外的所有层。

这正是 `win_textbox()` 的用途。该函数还设置边距，使文本能在框内恰当换行。

## 脚本、控制台 IO 与其他便利功能 {#sec-misc}

### TTE 格式化命令 {#ssec-misc-tags}

TTE 上下文包含控制位置、颜色、字体以及其他一些东西的成员。有两种方法更改这些参数。第一种是通过直接成员访问或像 `tte_set_ink()` 这样的函数，把改动硬编码进状态。这又好又快，但不够灵活。第二种是在字符串本身使用<dfn>格式化标签</dfn>——系统为这些标签解析字符串并相应解释。这基本上是一种脚本形式。

TTE 使用的标签看起来像这样：

```
#{`_`tag0`_`:`_`args`_`; `_`tag1`_`:`_`args`_`}
```

代码本身以 \``#{`' 开始，以 \``}`' 结束。每个命令由一个标签、一个冒号以及适当时用逗号分隔的参数组成。多个命令可以用分号分隔。例如，\``#{es; P:10,16}`' 会清屏并把光标设到 (10, 16)。

现在，我可以展示如何解析这个，但目前用于此的解析器，嗯，我们直说吧，又长又非常丑。本质上，它是一个巨大的 switch 块（有时是_双重_ switch 块），带着像这样的东西：

<pre><code class="language-c hljs">char *tte_cmd_default(const char *str)
{
    int ch, val;
    char *curr= (char*)str, *next;

    TTC *tc= tte_get_context();

    while(1)
    {
        ch= *curr;
        next= curr+1;

        // <span class="bold">(1)</span> Check first character
        switch(ch)
        {
        // <span class="bold">(2)</span> --- Absolute Positions ---
        case 'X':
            tc-&gt;cursorX= curr[1]==':'           // If there's an argument ...
                ? strtol(curr+2, &amp;next, 0)     // set cursor X to arg
                : tc-&gt;marginLeft;               // else move to start of line.
            break;

        // ... more cases ...

        // <span class="bold">(3)</span> Find EOS/EOC/token and act on it
        curr= tte_cmd_next(next);

        if(curr[0] == '\0')
            return curr;
        else if(curr[0] == '}')
            return curr+1;
    }
}
</code></pre>

正如我说的，丑；但暂时只能将就。传入的指针指向 '`#{`' 之后的第一个字符。命令标签都是单字母或双字母；switch 寻找一个被识别的字母并相应行动。

其中一个标签是 '`X`'，它设置光标的绝对 X 坐标。如果有参数，`tc->cursorX` 会被设为该参数；否则设为左边距。注意这里 [`strtol()`](https://en.cppreference.com/w/c/string/byte/strtol) 的使用。这是一个非常有趣的函数。它不仅适用于十进制和十六进制字符串，而且通过第二个参数，你可以检索到字符串中数字之后位置的指针。替代方案是 `sscanf()` 或 `atoi()`，但 `strtol()` 更好。

处理一个标签后，它会寻找更多标签，或者如果找到结束分隔符或字符串结尾就退出。

{\*@tbl:tte-cmd} 展示了可用的标签。注意它们是大小写敏感的，某些条目根据参数数量可以做不止一件事。

<div class="cblock">
  <table id="tbl:tte-cmd" class="table-data" width= 70%>
    <caption align="bottom">
      <b>{*@tbl:tte-cmd}</b>: 可用的 TTE 格式化标签。
    </caption>
    <tr>
      <th>代码（Code）</th>
      <th>描述（Description）</th>
    </tr>
    <tr>
      <td>P </td>
      <td>重置位置到左上边距。 </td>
    </tr>
    <tr>
      <td>Pr </td>
      <td>恢复光标位置（另见 <code>Ps</code>）。 </td>
    </tr>
    <tr>
      <td>Ps </td>
      <td>保存光标位置。 </td>
    </tr>
    <tr>
      <td>P: <i>x</i>,<i>y</i> </td>
      <td>把光标设到坐标 (<i>x</i>,&nbsp;<i>y</i>)。 </td>
    </tr>
    <tr>
      <td>X </td>
      <td>把 <code>cursorX</code> 重置到左边距。</td>
    </tr>
    <tr>
      <td>X: <i>x</i> </td>
      <td>把 <code>cursorX</code> 设为 <i>x</i>。 </td>
    </tr>
    <tr>
      <td>Y </td>
      <td>把 <code>cursorY</code> 重置到上边距。 </td>
    </tr>
    <tr>
      <td>Y: <i>y</i> </td>
      <td>把 <code>cursorY</code> 设为 <i>y</i>。 </td>
    </tr>
    <tr>
      <td>c[ispx]:&nbsp;<i>cattr</i> </td>
      <td>
        把 ink (<code>ci</code>)、shadow (<code>cs</code>)、paper (<code>cp</code>) 或 special (<code>cx</code>) 颜色属性设为 <i>cattr</i>。
      </td>
    </tr>
    <tr>
      <td>e[slbf] </td>
      <td>
        擦除边距之间的屏幕（<code>es</code>）、当前行（<code>el</code>）、到光标的当前行（<code>eb</code>；向后）、从光标起的当前行（<code>ef</code>；向前）。
      </td>
    </tr>
    <tr>
      <td>er: <i>l</i>,<i>t</i>,<i>r</i>,<i>b</i> </td>
      <td>擦除以 (<i>l</i>,<i>t</i>) 到 (<i>r</i>,<i>b</i>) 给出的矩形。 </td>
    </tr>
    <tr>
      <td>f: <i>idx</i> </td>
      <td>把 <code>font</code> 设为 <code>TTC.fontTable[<i>idx</i>]</code>。 </td>
    </tr>
    <tr>
      <td>m[ltrb]:&nbsp;<i>value</i> </td>
      <td>
          把左（<code>ml</code>）、上（<code>mt</code>）、右（<code>mr</code>）或下（<code>mb</code>）边距设为 <i>value</i>。
      </td>
    </tr>
    <tr>
      <td>m: <i>l</i>,<i>t</i>,<i>r</i>,<i>b</i> </td>
      <td>把边距设为矩形 (<i>l</i>,<i>t</i>) - (<i>r</i>,<i>b</i>) </td>
    </tr>
    <tr>
      <td>p: <i>dx</i>, <i>dy</i> </td>
      <td>把光标移动 (<i>dx</i>, <i>dy</i>)。 </td>
    </tr>
    <tr>
      <td>s: <i>idx</i> </td>
      <td>打印 <code>TTC.stringTable</code> 中第 <i>idx</i> 个字符串。 </td>
    </tr>
    <tr>
      <td>w: <i>count</i> </td>
      <td>等待 <i>count</i> 帧。 </td>
    </tr>
    <tr>
      <td>x: <i>dx</i> </td>
      <td>把光标向右移动 <i>dx</i>。 </td>
    </tr>
    <tr>
      <td>y: <i>dy</i> </td>
      <td>把光标向下移动 <i>dy</i>。 </td>
    </tr>
  </table>
</div>

我应该指出，目前这些命令仍然脆弱，所以使用这些东西要小心。例如，定位命令只会移动光标，而不会裁剪到边距。还要小心字体和字符串命令（`f` 和 `s`）。`tte_cmd_default()` 不会测试索引是否越界，所以你可能会得到……奇怪的东西。在某个时候，我希望修复这些问题，但现在这不是优先事项。如果有人有更健壮、我能用的东西，请说出来。

:::warning TTE 格式化命令：买家自负（caveat emptor）

TTE 中当前的命令还不怎么防呆。如果你坚持合理的事情，它应该能很好工作。但如果你不小心，仍然很容易搬起石头砸自己的脚。

:::

### 使用控制台 I/O {#ssec-misc-conio}

像 `tte_write()` 这样的东西对纯字符串很好，但真正有帮助的是如果你有类似 `printf()` 的东西。在过去（2006 年之前），`printf()`、`putc` 和其他控制台输出函数不可用，但 Wintermute 给 devkitArm 的标准 C 库加了一个机制，使它们也能用于控制台。

让标准控制台例程在 GBA 上工作的关键，是把控制台输出的默认 `write_r` 重定向到我们自己制作的那个。在解释它如何工作之前，我想让你明白这非常接近黑魔法。它涉及深入库的根基，几乎没有关于这些如何工作的文档。这个故事是我能找到的接近完整描述的东西：[Embedding GNU: Newlib, Part 2](https://web.archive.org/web/20100209210107/https://www.embedded.com/story/OEG20020103S0073)，但它对解释也不多。

换句话说：你在一个洞穴里；里面漆黑一片，还有 [grues](<https://en.wikipedia.org/wiki/Grue_(monster)>)（洞穴怪物）出没。

让标准控制台例程在 GBA 上工作的关键，是把控制台输出的默认 `write_r` 重定向到我们自己制作的那个。这涉及一个叫做 `devoptab_t` 的结构体，定义在 `sys/iosupport.h` 中。它包含一个函数指针表，用于设备操作。我们这里感兴趣的指针是 `write_r`；这是 `printf()` 等用于最终输出的函数。

```c {.proglist}
// Partial devoptab_t definition
typedef struct {
    const char *name;
    int structSize;
    int (*open_r)(struct _reent *r, void *fileStruct, const char *path,
        int flags,int mode);
    int (*close_r)(struct _reent *r,int fd);
    int (*write_r)(struct _reent *r,int fd,const char *ptr,int len);
    ...
} devoptab_t;
```

既然说完了，我们继续。第一步是创建我们的替换写入器。在 TTE 的情况下，这是 `tte_con_write()`。它几乎与 `tte_write()` 相同，但必须符合 `devoptab_t.write_r` 给出的格式。归结为：

<pre><code class="language-c hljs">//! internal output routine used by printf.
/*! \param r    Reentrancy parameter.
    \param fd   File handle (?).
    \param text Text buffer containing the string prepared by printf.
    \param len  Length of string.
    \return     Number of output bytes (?)
    \note       \a text is NOT zero-terminated!!!!one!
*/
int tte_con_write(struct _reent *r, int fd, const char *text, int len)
{
    // <span class="bold">(1)</span> Safety checks
    if(!sConInitialized || !text || len&lt;=0)
        return -1;

    int ch, gid, charW;
    const char *str= text, *end= text+len;

    // <span class="bold">(2)</span> check for end of text
    while( (ch= *str) != 0 &amp;&amp; str &lt; end)
    {
        str++;
        switch(ch)
        {

        // <span class="bold">(3)</span> --- VT100 sequence ( ESC[foo; ) ---
        case 0x1B:
            if(str[0] == '[')
                str += tte_cmd_vt100(str);
            break;

        //# <span class="bold">(4)</span> Other character cases. See tte_write()
        }
    }

    return str - text;
}

</code></pre>

虽然我在这里为参数加了文档，但大多基于猜测。`r` 参数包含[可重入性](https://en.wikipedia.org/wiki/Reentrancy_(computing))信息，如果你有多个线程会很有用。由于 GBA 是单线程系统，这不应该困扰我们。我相信 `fd` 是某种文件句柄，但由于我们不写文件，这同样不困扰我们。

真正感兴趣的参数是 `text` 和 `len`。`text` 参数指向带有要渲染字符串的缓冲区。在 `printf()` 的情况下，它是_格式化之后_的字符串：所有像 `%d` 这样的代码都已经处理完。现在到了最重要的部分：`text` **不是**以空字符结尾的。这就是为什么还有一个长度变量。

据我所知，`printf` 使用栈上一个大缓冲区（约 1300 字节）来写入格式化后的数字。这个缓冲区在你再次调用时不会被清空，发送到写入器时也不会以 ‘\\0’ 终止。这有如下后果：

- 1300 字节是不少的 IWRAM。确保你有足够的空间。_不要_从中断调用 `printf()`，因为该例程很慢，而且这些东西会开始嵌套并破坏一切。
- 别忘了 `len` 参数。由于缓冲区不会被清零，旧数据的残余可能还在，于是你会得到垃圾。
- 关于这里格式化命令的解析还有一个潜在危险。当字符串超过缓冲区长度时，我猜想它被拆成更小的块。我不知道如果拆分发生在命令中间会发生什么，但我怀疑不会好。当然，你本就不该有那么长的字符串，因为屏幕不够大放不下它们。

除此之外，`tte_con_write()` 很直接。如前所述，循环的内容与 `tte_write()` 中的几乎相同。唯一真正的区别是第 3 点。这是对 VT100 格式化字符串的测试，将在下一小节介绍。

为了使用新的写入器，你必须把它挂到设备列表中。首先，创建一个 `devoptab_t` 实例，把写入器放在正确的位置。有一个叫做 `devoptab_list` 的设备操作列表。感兴趣的设备是流 `stdout` 和 `stderr`，它们是列表中的 `STD_OUT` 和 `STD_ERR` 条目。只需把这些条目指向你自己的结构体。

第二项是设置这些流的缓冲区。我不确定这是否真的必要，但 libgba 里就是这么做的，而它的作者最懂这个系统，所以我不想在这里争辩。用于此的函数是 `setvbuf()`。你在下面找到所需的初始化步骤。

```c {#cd-tte-init-con .proglist}

static int sConInitialized= 0;

const devoptab_t tte_dotab_stdout=
{
    "ttecon",
    0,
    NULL,
    NULL,
    tte_con_write,
    NULL,
    NULL,
    NULL
};

//! Init stdio capabilities for TTE.
void tte_init_con()
{
    // attach our operations to stdout and stderr.
    devoptab_list[STD_OUT] = &tte_dotab_stdout;
    devoptab_list[STD_ERR] = &tte_dotab_stdout;

    // Set buffers.
    setvbuf(stderr, NULL , _IONBF, 0);
    setvbuf(stdout, NULL , _IONBF, 0);

    sConInitialized = 1;
}
```

调用 `tte_init_con()` 激活 stdio 的功能，这样你可以使用 `printf()` 之类的。注意原始的 `printf()` 相当重，而且它还有浮点选项，这在 GBA 环境中很少用，如果有的话。因此，你通常会用它的纯整数表亲 `iprintf()`。还要注意 TTE 的实现与 libgba 的**不同**，二者不应混淆。为此，我把 `iprintf()` 名字藏在 `tte_printf` 宏后面。

下面是一个简短的使用示例。我这里用 `tte_printf()`，但 `printf()` 或 `iprintf()` 同样能工作。

```c {#cd-hello .proglist}
#include <stdio.h>
#include <tonc.h>

int main()
{
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0;

    // Init BG 0 for text on screen entries.
    tte_init_se_default(0, BG_CBB(0)|BG_SBB(31));

    // Enable TTE's console functionality
    tte_init_con();

    tte_printf("#{P:72,64}");        // Goto (72, 64).
    tte_printf("Hello World!");      // Print "Hello world!"

    while(1);

    return 0;
}
```

:::warning Printf 包袱

尽管 `printf()` 很棒，它也有一些缺点。首先，它是一个非常重的函数，会调用相当大量的函数，这些都必须被链接进来。其次，它相当该死地慢。因为它能做那么多，它必须检查所有这些不同的情况。另外，对于字符串到十进制的转换它使用除法，这对 GBA 真的很糟。

意识到 `printf()` 的代价。如果它成为瓶颈，试着做你自己精简过的版本。一个像样的 `sprintf()` 替代品是 [Dan Posluns](https://www.danposluns.com/gbadev/) 创建的 `posprintf()`。

:::

### VT100 转义序列 {#ssec-misc-vt100}

每本讲 C 的书都会告诉你可以在控制台屏幕上放置文本。它们通常没告诉你的是，在某些环境中，你也可以控制格式。其中一个环境是 [VT100](https://en.wikipedia.org/wiki/VT100)，它使用<dfn>转义序列</dfn>（escape sequence）来表示格式。devkitPro 为各种系统分发的库使用这些序列，所以也支持它们是好主意。

这些代码的一般格式是：

```
CSI n1;n2 ... letter
```

_CSI_ 这里是<dfn>命令序列指示符</dfn>（command sequence indicator）的 ASCII 码，在这种情况下是转义字符（27，0x1B 或 033）后跟 '\['。末尾的字母表示格式化代码的种类，_n1_、_n2_ … 是格式化参数。维基百科有一个不错的标准集合概览[在这里](https://en.wikipedia.org/wiki/ANSI_escape_code)，这里还有另一个：[VT100 命令与控制序列](https://web.archive.org/web/20080813073220/http://local.wasp.uwa.edu.au/~pbourke/dataformats/vt100/)。注意并非所有代码在 devkitPro 库中都受支持。你最常遇到的是以下这些：

<div class="lblock">
  <table id="tbl:vt100" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:vt100}</b>: 常见 VT100 序列
    </caption>
    <tr>
      <td>ESC[<i>dy</i>A</td>
      <td>光标上移 <i>dy</i> 行。</td>
    </tr>
    <tr>
      <td>ESC[<i>dy</i>B</td>
      <td>光标下移 <i>dy</i> 行。</td>
    </tr>
    <tr>
      <td>ESC[<i>dx</i>C</td>
      <td>光标右移 <i>dx</i> 列。</td>
    </tr>
    <tr>
      <td>ESC[<i>dx</i>D</td>
      <td>光标左移 <i>dx</i> 列。</td>
    </tr>
    <tr>
      <td>ESC[<i>y</i>;<i>x</i>H</td>
      <td>把光标设到第 <i>y</i> 行、第 <i>x</i> 列。</td>
    </tr>
    <tr>
      <td>ESC[2J</td>
      <td>清屏。</td>
    </tr>
    <tr>
      <td>ESC[<i>n</i>K</td>
      <td>
        <ol start=0>
	        <li>擦除到行尾。</li>
          <li>擦除到行首。</li>
	        <li>擦除整行。</li>
	      </ol>
      </td>
    </tr>
    <tr>
      <td>ESC[<i>y</i>;<i>x</i>f</td>
      <td>同 ESC[<i>y</i>;<i>x</i>H</td>
    </tr>
    <tr>
      <td>ESC[s</td>
      <td>保存光标位置。</td>
    </tr>
    <tr>
      <td>ESC[u</td>
      <td>恢复光标位置。</td>
    </tr>
  </table>
</div>

如果你把这个列表与 {@tbl:tte-cmd} 比较，你会看到大多数这些代码有对应的 TTE 命令。两者你都可以用，但如果你打算做一些应该是跨平台的东西，请用 VT100 代码。

:::warning 与标准的偏差

我正努力让我的实现尽可能贴近标准。这主要是因为 TTE 使用的不只是常规背景上的 8x8 字符。特别是，这里缺少滚动，也没有颜色代码。暂时。

:::

### UTF-8 {#ssec-misc-utf}

你可能听说过一个叫 [ASCII](https://en.wikipedia.org/wiki/ASCII) 的小东西。这是（或曾是；我不确定）字符字符串的标准编码。每个字符 1 字节长，给字母、数字等 256 个数字。{\*@fig:img-verdana9} 和 {@fig:img-verdana9-b4} 包含字符 32 到 255，正如它们通常出现在 Windows 上。ASCII 对西方语言工作良好，但对像日语这样有数千字符的语言完全不够。为补救，他们想出了 Unicode，每个字符 16 位。

介于两者之间的是 [UTF-8](https://en.wikipedia.org/wiki/UTF-8)。它对较低的 128 个 ASCII 码仍使用 8 位字符，但超过 0x80 的字节表示多字节码的开始，其中它与后面几个字符一起组成一个最多 21 位的更大字符。

UTF-8 是一种两全其美的好方法：你仍可以对拉丁字符使用普通字符，意味着它仍能与 ASCII 程序配合工作，但你也有表示更大数字的方法。

<div class="cblock">
  <table id="tbl:utf8" class="table-data">
    <caption align="bottom">
      {*@tbl:utf8}. UTF-8 到 u32 转换表。
    </caption>
    <tr> 
      <th>字符串（二进制）</th>
      <th>数字（二进制）</th>
      <th>范围（十六进制）</th>
    </tr>
    <tbody style="font:85%, Courier New;">
      <tr>
        <td>0zzzzzzz		</td>
        <td>0zzzzzzz		</td>
        <td>0x000000 - 0x00007F（7 位）	</td>
      </tr>
      <tr>
        <td>110yyyyy 10zzzzzz	</td>
        <td>00000yyy yyzzzzzz	</td>
        <td>0x000080 - 0x0007FF（11 位）	</td>
      </tr>
      <tr>
        <td>1110xxxx 10yyyyyy 10zzzzzz	</td>
        <td>xxxxyyyy yyzzzzzz	</td>
        <td>0x000800 - 0x00FFFF（16 位）	</td>
      </tr>
      <tr>
        <td>11110www 10xxxxxx 10yyyyyy 10zzzzzz	</td>
        <td>000wwwxx xxxxyyyy yyzzzzzz	</td>
        <td>0x010000 - 0x10FFFF（21 位）	</td>
      </tr>
    </tbody>
  </table>
</div>

{\*@tbl:utf8} 展示了转换如何工作。如果一个字节小于 128，它是一个简单的 ASCII 字符。如果更大，它可以落入三类多字节数字。字节的范围决定整个东西的字节数；一旦你知道了，你需要从这些字节中抓取适当的位模式，并把它们连接成一个数字，如表所示。更多细节，我让你参考维基百科页面。

下面你可以找到一个从字符串读取并解码单个 utf-8 字符的例程。是的，它是一坨条件语句的集群（cluster-f\*\*k），但那是为了检查所有字符是否真的遵循格式所必需的；如果不遵循，它会把该范围的第一个字节解释为一个扩展的 ASCII 字符。如果你愿意，你可以省略所有 \``if((*src>>6)!=2) break;`' 语句。

```c {#cd-utf8-decode .proglist}
//! Retrieve a single multibyte utf8 character.
uint utf8_decode_char(const char *ptr, char **endptr)
{
    uchar *src= (uchar*)ptr;
    uint ch8, ch32;

    // Poor man's try-catch.
    do
    {
        ch8= *src;
        if(ch8 < 0x80)                      // 7bit
        {
            ch32= ch8;
        }
        else if(0xC0<=ch8 && ch8<0xE0)      // 11bit
        {
            ch32  = (*src++&0x1F)<< 6;  if((*src>>6)!=2)    break;
            ch32 |= (*src++&0x3F)<< 0;
        }
        else if(0xE0<=ch8 && ch8<0xF0)      // 16bit
        {
            ch32  = (*src++&0x0F)<<12;  if((*src>>6)!=2)    break;
            ch32 |= (*src++&0x3F)<< 6;  if((*src>>6)!=2)    break;
            ch32 |= (*src++&0x3F)<< 0;
        }
        else if(0xF0<=ch8 && ch8<0xF8)      // 21bit
        {
            ch32  = (*src++&0x0F)<<18;  if((*src>>6)!=2)    break;
            ch32 |= (*src++&0x3F)<<12;  if((*src>>6)!=2)    break;
            ch32 |= (*src++&0x3F)<< 6;  if((*src>>6)!=2)    break;
            ch32 |= (*src++&0x3F)<< 0;
        }
        else
            break;

        // Proper UTF8 char: set endptr and return
        if(endptr)
            *endptr= (char*)src;

        return ch32;
    } while(0);

    // Not really UTF: interpret as single byte.
    src= (uchar*)ptr;
    ch32= *src++;
    if(endptr)
        *endptr= (char*)src;

    return ch32;
}
```

`tte_write()` 和 `tte_write_con()` 都在字符串需要时使用 `utf_decode_char()`。更大的字符可用于访问更大的字体表。你可以用更大的表来更好地支持语言，或者也许用箭头和其他类型的符号扩展标准字符集。

然而，使用 UTF-8 与 stdio 有一个陷阱。在内部，stdio 对什么是可接受的非常挑剔。例如，版权符号 © 是扩展数字 0xA9。在非 UTF-8 中，你可以在字符串中只用 0xA9 就能使用正确的符号。然而，单独的 0xA9 不适合 {\*@tbl:utf8} 中的任何格式，所以它在 UTF-8 中是无效代码。虽然 `utf8_decode_char()` 在这种情况下是宽容的，但 stdio 不是，它会把它解释为终止符。换句话说，小心扩展 ASCII 字符；如果你想要用 stdio 函数，你_必须_使用正确的 UTF-8 格式。

:::warning Printf、UTF-8 与扩展 ASCII

截至 devkitArm r22，`printf()` 和其他 stdio 函数使用 UTF-8 区域设置。这实际上意味着你不能再像旧版本那样直接使用‘©’和‘è’这样的字符。你需要使用完整的多字节 UTF-8 表示。

:::

### 分析渲染器性能 {#ssec-misc-profile}

看看你做的东西有多快总是个好主意。当函数很复杂时尤其如此，就像大多数位图和图块渲染器那样。

{\*@tbl:tte-profile} 列出了大多数可用渲染器每个字形的周期数。这些是在 ROM 中代码（和库代码）使用默认等待状态、在 -O2 优化下测得的。使用的字体是 verdana 9，单元格大小为 8x16，意味着它可以轻松用于定宽和变宽。测试字符串是来自 [Portal](<https://en.wikipedia.org/wiki/Portal_(video_game)>) 的一行 194 字符：

> “请注意，我们为失败添加了一个后果。与舱室地面的任何接触都会导致你的官方测试记录上出现一个‘不令人满意’的标记，随后是死亡。祝好运！”

<div class="lblock">
  <table id="tbl:tte-profile" class="table-data">
    <caption align="bottom">
      <b>{*@tbl:tte-profile}</b>: 渲染器耗时。条件：194 字符，verdana 9，ROM 代码，默认等待，-O2。
    </caption>
    <tr>
      <th>渲染器（Renderer）</th>
      <th>周期/字符（Cycles/char）</th>
    </tr>
    <tr>
      <td>null</td>
      <td align="right"> 221</td>
    </tr>
    <tr>
      <td>se_drawg</td>
      <td align="right"> 595</td>
    </tr>
    <tr>
      <td>se_drawg_w8h16</td>
      <td align="right"> 370	</td>
    </tr>
    <tr>
      <td>ase_drawg_w8h16</td>
      <td align="right"> 458	</td>
    </tr>
    <tr>
      <td>chr4_drawg_b1cts_base</td>
      <td align="right">3049	</td>
    </tr>
    <tr>
      <td>chr4_drawg_b1cts</td>
      <td align="right">2044	</td>
    </tr>
    <tr>
      <td>chr4_drawg_b1cts_fast</td>
      <td align="right"> 631	</td>
    </tr>
    <tr>
      <td>bmp8_drawg_b1cts_base</td>
      <td align="right">2875	</td>
    </tr>
    <tr>
      <td>bmp8_drawg_b1cts</td>
      <td align="right">2078	</td>
    </tr>
    <tr>
      <td>bmp8_drawg_b1cts_fast</td>
      <td align="right"> 619	</td>
    </tr>
    <tr>
      <td>bmp16_drawg_b1cts_base</td>
      <td align="right">2456	</td>
    </tr>
    <tr>
      <td>bmp16_drawg_b1cts</td>
      <td align="right">1503</td>
    </tr>
    <tr>
      <td>obj_drawg</td>
      <td align="right"> 423</td>
    </tr>
  </table>
</div>

首先，注意数值的巨大差异：从图块映射和对象的几百，到位图和图块渲染器的_几千_。而且这是每个字符，所以写入大片文本会导致显著减速。

`null()` 渲染器是一个虚拟渲染器，用于找出 TTE 系统的开销。考虑到所有情况（记住：ROM 代码），200 其实不算太糟。话虽如此，现在把这个数字与常规图块映射时间比较：开销在这里占了相当大的一部分。还要注意 `se_drawg` 的标准版和 8×16 版之间的差异：这纯粹来自循环。

TTE 开销的一半实际上来自换行代码；光标设置和检查可能相对较慢。我甚至还没考虑裁剪。

对于位图和图块渲染器，我计时了三个版本。一个‘基础’版本，使用[“图块上的文本渲染”一节](#ssec-chr-drawg)中 `chr4_drawg_b1cts_base()` 的模板；C 优化版本，即默认渲染器；以及一个快速 asm 版本。

`bmp16` 变体比其他更快，因为你不必把项掩码进表面。不过有趣的是，`bmp8` 和 `chr4` 之间的差异几乎为零。这可能与字体本身的布局有关。

还要注意基础版、普通版和快速版的比较。`chr4_drawg_b1cts()` 比基础版快 33%，而 `chr4_drawg_b1cts_fast` 还要快三倍。记住，那 631 中的 200 是 TTE 开销，所以它实际上是快了 4.5 倍。这不只来自 IWRAM 的好处：它也与 ARM 对比 Thumb，以及手工汇编对比编译代码有关。

## 结论 {#sec-conc}

就我而言，本章基本上是[早先的文本章](text.html)做对了的样子。它涵盖了所有类型的图形：常规/仿射图块映射、8bpp/16bpp 位图、4bpp 图块和对象。好吧，我漏掉了 8bpp 图块，但那无论如何都是图块渲染的糟糕模式。这里给出的字形渲染函数适用于任意尺寸、定宽和变宽字体，并且应该也能高效地做到这一点。

此外，它展示了 Tonc 的文本引擎，一个相对轻松处理所有这些不同文本族的系统。初始设置之后，表面相关的方面基本上被处理掉了，使其功能更具可复用性。我还涵盖了为打印处理字符串的最基本方面：如何从 UTF-8 编码字符转换到字体表中的字形索引，以及如何实现格式化标签以动态改变位置、颜色和字体。最后，我演示了如何构建一个 stdio 例程可以调用以进行输出的回调，使 `printf()` 及其朋友们可用于一般用途。

整章是 TTE 及其能力的展示。尽管它还没完全完成，我认为它可以成为处理文本的宝贵资产。即便没有别的，这里提出的概念也应该能帮助你设计自己的字形渲染器或文本系统。