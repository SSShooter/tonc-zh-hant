// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded affix "><a href="foreword.html">前言</a></li><li class="chapter-item expanded affix "><a href="intro.html">引言</a></li><li class="chapter-item expanded affix "><li class="part-title">GBA 基础</li><li class="chapter-item expanded "><a href="hardware.html"><strong aria-hidden="true">1.</strong> GBA 硬件</a></li><li class="chapter-item expanded "><a href="setup.html"><strong aria-hidden="true">2.</strong> 搭建开发环境</a></li><li class="chapter-item expanded "><a href="first.html"><strong aria-hidden="true">3.</strong> 我的第一个 GBA 演示程序</a></li><li class="chapter-item expanded "><a href="video.html"><strong aria-hidden="true">4.</strong> 视频显示入门</a></li><li class="chapter-item expanded "><a href="bitmaps.html"><strong aria-hidden="true">5.</strong> 位图模式</a></li><li class="chapter-item expanded "><a href="keys.html"><strong aria-hidden="true">6.</strong> GBA 按键</a></li><li class="chapter-item expanded "><a href="objbg.html"><strong aria-hidden="true">7.</strong> 精灵与图块背景概述</a></li><li class="chapter-item expanded "><a href="regobj.html"><strong aria-hidden="true">8.</strong> 常规精灵</a></li><li class="chapter-item expanded "><a href="regbg.html"><strong aria-hidden="true">9.</strong> 常规图块背景</a></li><li class="chapter-item expanded affix "><li class="part-title">GBA 进阶</li><li class="chapter-item expanded "><a href="affine.html"><strong aria-hidden="true">10.</strong> 仿射变换矩阵</a></li><li class="chapter-item expanded "><a href="affobj.html"><strong aria-hidden="true">11.</strong> 仿射精灵</a></li><li class="chapter-item expanded "><a href="affbg.html"><strong aria-hidden="true">12.</strong> 仿射图块背景</a></li><li class="chapter-item expanded "><a href="gfx.html"><strong aria-hidden="true">13.</strong> 图形特效</a></li><li class="chapter-item expanded "><a href="dma.html"><strong aria-hidden="true">14.</strong> 直接内存访问（DMA）</a></li><li class="chapter-item expanded "><a href="timers.html"><strong aria-hidden="true">15.</strong> 定时器</a></li><li class="chapter-item expanded "><a href="interrupts.html"><strong aria-hidden="true">16.</strong> 硬件中断</a></li><li class="chapter-item expanded "><a href="swi.html"><strong aria-hidden="true">17.</strong> BIOS 调用（SWI）</a></li><li class="chapter-item expanded "><a href="sndsqr.html"><strong aria-hidden="true">18.</strong> 哔！GBA 声音入门</a></li><li class="chapter-item expanded affix "><li class="part-title">进阶 / 应用</li><li class="chapter-item expanded "><a href="text.html"><strong aria-hidden="true">19.</strong> 文本系统</a></li><li class="chapter-item expanded "><a href="mode7.html"><strong aria-hidden="true">20.</strong> Mode 7</a></li><li class="chapter-item expanded "><a href="mode7ex.html"><strong aria-hidden="true">21.</strong> 更多 Mode 7 技巧</a></li><li class="chapter-item expanded "><a href="tte.html"><strong aria-hidden="true">22.</strong> Tonc 文本引擎</a></li><li class="chapter-item expanded "><a href="asm.html"><strong aria-hidden="true">23.</strong> ARM 汇编速成</a></li><li class="chapter-item expanded "><a href="lab.html"><strong aria-hidden="true">24.</strong> 实验室</a></li><li class="chapter-item expanded affix "><li class="spacer"></li><li class="chapter-item expanded affix "><a href="numbers.html">附录 A - 数字、比特与位运算</a></li><li class="chapter-item expanded affix "><a href="fixed.html">附录 B - 定点数与查找表（LUT）</a></li><li class="chapter-item expanded affix "><a href="matrix.html">附录 C - 向量与矩阵数学</a></li><li class="chapter-item expanded affix "><a href="makefile.html">附录 D - 更多关于 makefile 与编译器选项</a></li><li class="chapter-item expanded affix "><a href="edmake.html">附录 E - 通过编辑器进行 Make</a></li><li class="chapter-item expanded affix "><a href="refs.html">附录 F - 参考文献</a></li><li class="chapter-item expanded affix "><a href="log.html">附录 G - 更新日志</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
