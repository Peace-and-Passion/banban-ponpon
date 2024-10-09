/**
次に、toastを作ろう。MaterializeCSSのToast風のものだ。

仕様

・Svelteではなく、TypeScriptで作る。toast.ts
・Toast.show(msg)で画面右上にmsgを表示。
・msgは1remのpaddingとborder-radius: 6pxがついている。水色のデフォルト以外の背景色はclassで変えられる。
・msgは1秒間表示され、0.5秒で30px上に移動しながら徐々に消えるときに
 */
class Toast {
    private static toastContainer: HTMLDivElement;

    // Private constructor to prevent instantiation
    private constructor() {}

    static {
        // Set up the toast container
        Toast.toastContainer = document.createElement('div');
        Toast.toastContainer.setAttribute("id", 'ponpon-toast-container');
        document.body.appendChild(Toast.toastContainer);
    }

    public static show(msg: string, className: string = 'ponpon-default-toast') {
        const toast = document.createElement('div');
        toast.className = `ponpon-toast ${className}`;
        toast.innerText = msg;
        Toast.toastContainer.appendChild(toast);

        // Start the fade-out effect after 1 second
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-30px)';

            // Remove toast from DOM after the transition
            setTimeout(() => {
                Toast.toastContainer.removeChild(toast);
            }, 500); // Match the duration of the CSS transition
        }, 1000);
    }
}

export default Toast;
