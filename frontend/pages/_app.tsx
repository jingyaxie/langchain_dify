import React from 'react';
import type { AppProps } from 'next/app';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { AuthProvider } from '../components/AuthProvider';
import '../styles/globals.css';

// 扩展Chakra UI主题
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  colors: {
    brand: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C7',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
      },
    },
    Link: {
      baseStyle: {
        color: 'brand.500',
        _hover: {
          textDecoration: 'none',
          color: 'brand.600',
        },
      },
    },
    Table: {
      variants: {
        simple: {
          thead: {
            tr: {
              th: {
                borderBottom: '2px solid',
                borderColor: 'gray.200',
                bg: 'gray.100',
                color: 'gray.700',
                fontWeight: 'bold',
              }
            }
          },
          tbody: {
            tr: {
              _hover: {
                bg: 'gray.50',
              },
              td: {
                borderBottom: '1px solid',
                borderColor: 'gray.200',
              }
            }
          }
        }
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'xl',
          bg: 'white',
        },
      },
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ChakraProvider>
  );
}

export default MyApp; 