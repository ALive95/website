(function () {
    var KEY = 'theme';

    function readStored() {
        try {
            var v = localStorage.getItem(KEY);
            if (v) return v;
        } catch (e) {}
        var m = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
        return m ? m[1] : null;
    }

    function store(value) {
        try {
            localStorage.setItem(KEY, value);
        } catch (e) {}
        document.cookie = 'theme=' + value + ';path=/;max-age=31536000;samesite=lax';
    }

    function apply(value) {
        document.documentElement.setAttribute('data-theme', value);
    }

    apply(readStored() === 'light' ? 'light' : 'dark');

    var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="12" cy="12" r="4.2"/>' +
        '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>' +
        '</svg>';

    var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M20.5 14.8A8.6 8.6 0 0 1 9.2 3.5a8.6 8.6 0 1 0 11.3 11.3z"/>' +
        '</svg>';

    /* On touch there is no :hover, so tapping a menu parent just followed its
       link and the submenu was unreachable. First tap opens the menu, second
       tap follows the link. */
    function initNavDropdowns() {
        var parents = document.querySelectorAll('.site-nav .dropdown > a');
        if (!parents.length) return;

        function closeAll() {
            var open = document.querySelectorAll('.site-nav .dropdown.open');
            for (var i = 0; i < open.length; i++) {
                open[i].classList.remove('open');
            }
        }

        function bind(link) {
            link.addEventListener('click', function (e) {
                if (window.matchMedia('(hover: hover)').matches) return;
                var li = link.parentNode;
                if (li.classList.contains('open')) return;
                e.preventDefault();
                closeAll();
                li.classList.add('open');
            });
        }

        for (var i = 0; i < parents.length; i++) {
            bind(parents[i]);
        }

        /* Tapping anywhere outside a menu closes it. */
        document.addEventListener('click', function (e) {
            var el = e.target;
            while (el && el !== document) {
                if (el.classList && el.classList.contains('dropdown')) return;
                el = el.parentNode;
            }
            closeAll();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initNavDropdowns();

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-toggle';

        function sync() {
            var light = document.documentElement.getAttribute('data-theme') === 'light';
            btn.innerHTML = light ? MOON : SUN;
            btn.title = light ? 'Switch to dark mode' : 'Switch to light mode';
            btn.setAttribute('aria-label', btn.title);
        }

        btn.addEventListener('click', function () {
            var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            apply(next);
            store(next);
            sync();
        });

        sync();
        document.body.appendChild(btn);
    });
})();