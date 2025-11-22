# Site Forwarder

This web application allows users to forward from one website to another based on URL parameters. Users can control how the forwarding happens by selecting different options, such as forwarding in the current tab, a new tab, or a new window. Additionally, users can configure the forwarding URL through query parameters.

## Features
- **Site Forwarding**: Redirect users to another URL based on parameters.
- **Forwarding Options**:
  - Open in the current tab
  - Open in a new tab
  - Open in a new window
- **Automatic Forwarding**: If the `autoforward` parameter is set to true, the site will automatically forward without needing to press a button.
- **Dynamic Radio Button Selection**: Based on the `tab` parameter, the radio buttons will be pre-selected to indicate how the site should be forwarded.

## Usage

### 1. Run the Application
To use the application, you need to host the HTML file on any web server or use it locally by opening the file in a browser.

### 2. URL Parameters

The application uses the following URL parameters to control its behavior:

- **`site`**: (Required) The name of the site you are forwarding from.
- **`forward`**: (Required) The URL you want to forward to.
- **`autoforward`**: (Optional) If set to `true`, the site will automatically forward after loading. Defaults to `false`.
- **`tab`**: (Optional) Determines how the forwarding site is opened. Accepts the following values:
  - `current` (default): Opens the site in the current tab.
  - `tab`: Opens the site in a new tab.
  - `window`: Opens the site in a new window.

### 3. Example URLs

#### Forwarding with Parameters
