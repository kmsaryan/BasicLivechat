// Default theme for the LiveChat component
export const defaultTheme = {
  // Colors
  'primary-color': '#007bff',
  'secondary-color': '#f8f9fa',
  'text-color': '#212529',
  'text-inverse-color': '#ffffff',
  'border-color': '#dee2e6',
  'background-color': '#f4f4f4',
  'bubble-own-color': '#007bff',
  'bubble-other-color': '#f1f1f1',
  
  // Sizing
  'border-radius': '5px',
  'padding': '10px',
  'font-size': '14px',
  'header-font-size': '16px',
  
  // Custom overrides can be added here
  containerStyle: {}
};

// Theme presets that can be used directly
export const themes = {
  dark: {
    'primary-color': '#343a40',
    'secondary-color': '#495057',
    'text-color': '#f8f9fa',
    'text-inverse-color': '#f8f9fa',
    'border-color': '#6c757d',
    'background-color': '#212529',
    'bubble-own-color': '#343a40',
    'bubble-other-color': '#495057'
  },
  light: defaultTheme,
  corporate: {
    'primary-color': '#0066cc',
    'secondary-color': '#f4f7fa',
    'text-color': '#333333',
    'text-inverse-color': '#ffffff',
    'border-color': '#dddddd',
    'background-color': '#f9f9f9',
    'bubble-own-color': '#0066cc',
    'bubble-other-color': '#f4f7fa'
  }
};
