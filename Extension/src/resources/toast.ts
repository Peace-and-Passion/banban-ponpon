const initialTop = 150;  // initial top of each toast
const toastHeight = 40;  // height of a toast
const spacing = 10; // トースト間のスペース

class Toast {
    private static toastCount: number = 0;

    // Private constructor to prevent instantiation
    private constructor() {}

    public static show(msg: string, className: string = 'ponpon-default-toast') {
        // Update positions of the remaining toasts
        Toast.updateToasts();

        const toast = document.createElement('div');
        toast.className = `ponpon-toast ${className}`;
        toast.innerText = msg;
        toast.style.top = `${initialTop}px`;  // Set the initial position of the toast
        document.body.appendChild(toast);

        // Start the fade-out effect after 1 second
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-30px)';

            // Remove toast from DOM after the transition
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500); // Match the duration of the CSS transition
        }, 1000);
    }

    private static updateToasts() {
        const toasts = document.querySelectorAll('.ponpon-toast');

        for (let i = 0; i < toasts.length; i++) {
            const toast = toasts[i];
            const newTop = initialTop - ((i + 1) * (toastHeight + spacing));
            toast.style.top = `${newTop}px`;
        };
    }
}

export default Toast;
