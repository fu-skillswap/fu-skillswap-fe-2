interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  nonce: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleButtonConfiguration {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
}

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
