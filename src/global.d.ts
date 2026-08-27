import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': any;
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'iconify-icon': any;
      }
    }
  }
}
