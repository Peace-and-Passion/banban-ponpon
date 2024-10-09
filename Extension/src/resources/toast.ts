/**
Toast: Show a message for a while. Repetitive messages are stacked properly.

  Usage:

   import Toast from '../resources/toast';
   Toast.show('message');
   Toast.error('error message');

  Test:

    Toast.show('Hello!');
    Toast.show('Peaceful');

    setTimeout(() => {
        Toast.show('World');
        setTimeout(() => {
             Toast.show('Forever');
        }, 500);
    }, 500);

 */

const initialTop = 150;  // initial top of each toast
const toastHeight = 40;  // height of a toast
const spacing = 10;      // spacing between toasts

class Toast {
    private static container: HTMLElement;
    private static toastCount: number = 0;

    static {
        Toast.container = document.createElement('div');
        Toast.container.setAttribute('id', 'ponpon-toast-container');
        document.body.appendChild(Toast.container);
    }

    // Private constructor to prevent instantiation
    private constructor() {}

    /** show a message. */
    public static show(msg: string, className: string = 'ponpon-default-toast') {
        const toast = document.createElement('div');
        toast.className = `ponpon-toast ${className}`;
        toast.innerText = msg;
        // toast.style.top = `${initialTop}px`;  // Set the initial position of the toast
        Toast.container.appendChild(toast);

        // Start the fade-out effect after 2 second
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-30px)';

            // Remove toast from DOM after the transition
            setTimeout(() => {
                Toast.container.removeChild(toast);
            }, 0.5 * 1000); // Match the duration of the CSS transition
        }, 2 * 1000);
    }

    /** show an error message. */
    public static error(msg: string, className: string = 'ponpon-error-toast') {
        Toast.show(msg, className);
    }
}

export default Toast;
