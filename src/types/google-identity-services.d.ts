/**
 * @file google-identity-services.d.ts
 * @description Định nghĩa các kiểu dữ liệu cho SDK Google Identity Services gắn vào Window object.
 */

/** Phản hồi credential nhận được từ Google OAuth Sign-In */
interface GoogleCredentialResponse {
  /** JWT token định danh người dùng từ Google */
  credential: string;
  select_by: string;
}

/** Cấu hình khởi tạo SDK Google Identity */
interface GoogleIdConfiguration {
  /** Client ID từ Google Cloud Console */
  client_id: string;
  nonce: string;
  /** Hàm callback nhận phản hồi sau khi đăng nhập thành công */
  callback: (response: GoogleCredentialResponse) => void;
}

/** Cấu hình tùy chọn giao diện cho nút Đăng nhập Google */
interface GoogleButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}

/** Bổ sung khai báo đối tượng google trên Window */
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (configuration: GoogleIdConfiguration) => void;
        renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
      };
    };
  };
}
