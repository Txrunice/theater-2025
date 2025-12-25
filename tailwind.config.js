/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 背景色：深邃的墨色 (代替纯黑)
        ink: {
          800: '#2d3436',
          900: '#1e272e', 
          950: '#0b0c10', // 主背景，接近黑的墨蓝
        },
        // 前景色：宣纸白 (用于文字)
        paper: {
          100: '#f1f2f6',
          200: '#dfe4ea', 
        },
        // 核心点缀：朱砂红
        cinnabar: {
          DEFAULT: '#c0392b', 
          glow: '#e74c3c', // 高亮时的红
        },
        // 流光：泥金
        gold: {
          DEFAULT: '#b7950b',
          light: '#f1c40f',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Playfair Display"', 'serif'], // 标题
        sans: ['"Noto Sans SC"', 'sans-serif'], // 正文
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}