// No @types package for sockjs-client is installed (the sandbox's package
// manager couldn't reliably write into node_modules for a dev-only types
// package — see chat). This minimal ambient declaration covers the one
// thing we use it for: opening a SockJS connection as the STOMP transport.
declare module 'sockjs-client' {
  export default class SockJS {
    constructor(url: string, _reserved?: any, options?: any);
  }
}
