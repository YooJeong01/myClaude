import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  conditions: {
    dark: ".dark &"
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          white: { value: "#FFFFFF" },
          black: { value: "#191919" },
          gray50: { value: "#F7F7F5" },
          gray100: { value: "#F1F1EF" },
          gray150: { value: "#EFEFEE" },
          gray200: { value: "#E9E9E7" },
          gray300: { value: "#DEDEDC" },
          gray495: { value: "#9B9B99" },
          gray500: { value: "#9B9A97" },
          gray600: { value: "#787774" },
          gray650: { value: "#6F6F6D" },
          gray775: { value: "#3F3F3F" },
          gray800: { value: "#37352F" },
          gray850: { value: "#2F2F2F" },
          gray875: { value: "#2A2A2A" },
          gray900: { value: "#242424" },
          gray925: { value: "#202020" },
          blue600: { value: "#0B6FC4" },
          blue400: { value: "#4EA1F5" },
          tagGrayBg: { value: "#F1F1EF" },
          tagGrayText: { value: "#5F5E5B" },
          tagGrayBgDark: { value: "#2F2F2F" },
          tagGrayTextDark: { value: "#D3D3D1" },
          tagBlueBg: { value: "#E8F2FF" },
          tagBlueText: { value: "#0B5CAD" },
          tagBlueBgDark: { value: "#17324A" },
          tagBlueTextDark: { value: "#9ECBFF" },
          tagGreenBg: { value: "#E7F5EE" },
          tagGreenText: { value: "#256E4A" },
          tagGreenBgDark: { value: "#183B2B" },
          tagGreenTextDark: { value: "#9FDBB9" },
          tagYellowBg: { value: "#FFF4D6" },
          tagYellowText: { value: "#7A5A00" },
          tagYellowBgDark: { value: "#4A3714" },
          tagYellowTextDark: { value: "#F1D37A" },
          tagRedBg: { value: "#FFECE8" },
          tagRedText: { value: "#A33A2B" },
          tagRedBgDark: { value: "#4A241F" },
          tagRedTextDark: { value: "#F4A69B" }
        },
        fonts: {
          body: {
            value:
              "'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif"
          }
        },
        durations: {
          fast: { value: "0.15s" },
          normal: { value: "0.2s" }
        },
        easings: {
          standard: { value: "ease" }
        },
        sizes: {
          touchTarget: { value: "44px" },
          sidebarCollapsed: { value: "72px" },
          sidebarExpanded: { value: "248px" },
          container: { value: "1280px" }
        },
        spacing: {
          safeTop: { value: "env(safe-area-inset-top)" },
          safeRight: { value: "env(safe-area-inset-right)" },
          safeBottom: { value: "env(safe-area-inset-bottom)" },
          safeLeft: { value: "env(safe-area-inset-left)" }
        },
        radii: {
          input: { value: "8px" },
          button: { value: "8px" },
          card: { value: "12px" },
          cardSm: { value: "10px" },
          cardLg: { value: "14px" },
          pill: { value: "999px" }
        },
        shadows: {
          popover: { value: "0 8px 24px rgba(0, 0, 0, 0.08)" }
        }
      },
      semanticTokens: {
        colors: {
          bg: { value: { base: "{colors.white}", _dark: "{colors.black}" } },
          bgSidebar: { value: { base: "{colors.gray50}", _dark: "{colors.gray925}" } },
          bgElevated: { value: { base: "{colors.white}", _dark: "{colors.black}" } },
          surface: { value: { base: "{colors.gray100}", _dark: "{colors.gray900}" } },
          border: { value: { base: "{colors.gray200}", _dark: "{colors.gray850}" } },
          borderStrong: { value: { base: "{colors.gray300}", _dark: "{colors.gray775}" } },
          text: { value: { base: "{colors.gray800}", _dark: "{colors.gray200}" } },
          textMuted: { value: { base: "{colors.gray600}", _dark: "{colors.gray495}" } },
          textFaint: { value: { base: "{colors.gray500}", _dark: "{colors.gray650}" } },
          dangerText: { value: { base: "#C0392B", _dark: "#FF6B6B" } },
          primary: { value: { base: "{colors.black}", _dark: "{colors.gray200}" } },
          primaryText: { value: { base: "{colors.white}", _dark: "{colors.black}" } },
          activeBg: { value: { base: "{colors.gray150}", _dark: "{colors.gray875}" } },
          activeText: { value: { base: "{colors.black}", _dark: "{colors.white}" } },
          link: { value: { base: "{colors.blue600}", _dark: "{colors.blue400}" } },
          tagGray: {
            bg: { value: { base: "{colors.tagGrayBg}", _dark: "{colors.tagGrayBgDark}" } },
            text: { value: { base: "{colors.tagGrayText}", _dark: "{colors.tagGrayTextDark}" } }
          },
          tagBlue: {
            bg: { value: { base: "{colors.tagBlueBg}", _dark: "{colors.tagBlueBgDark}" } },
            text: { value: { base: "{colors.tagBlueText}", _dark: "{colors.tagBlueTextDark}" } }
          },
          tagGreen: {
            bg: { value: { base: "{colors.tagGreenBg}", _dark: "{colors.tagGreenBgDark}" } },
            text: { value: { base: "{colors.tagGreenText}", _dark: "{colors.tagGreenTextDark}" } }
          },
          tagYellow: {
            bg: { value: { base: "{colors.tagYellowBg}", _dark: "{colors.tagYellowBgDark}" } },
            text: { value: { base: "{colors.tagYellowText}", _dark: "{colors.tagYellowTextDark}" } }
          },
          tagRed: {
            bg: { value: { base: "{colors.tagRedBg}", _dark: "{colors.tagRedBgDark}" } },
            text: { value: { base: "{colors.tagRedText}", _dark: "{colors.tagRedTextDark}" } }
          }
        }
      },
      textStyles: {
        xs: { value: { fontSize: "12px", lineHeight: "1.5", fontWeight: "400" } },
        sm: { value: { fontSize: "14px", lineHeight: "1.5", fontWeight: "400" } },
        md: { value: { fontSize: "16px", lineHeight: "1.5", fontWeight: "400" } },
        lg: { value: { fontSize: "18px", lineHeight: "1.3", fontWeight: "500" } },
        xl: { value: { fontSize: "20px", lineHeight: "1.3", fontWeight: "700" } },
        "2xl": { value: { fontSize: "24px", lineHeight: "1.25", fontWeight: "700" } },
        "3xl": { value: { fontSize: "30px", lineHeight: "1.25", fontWeight: "800" } },
        "4xl": { value: { fontSize: "36px", lineHeight: "1.25", fontWeight: "800" } }
      },
    },
    breakpoints: {
      xs: "360px",
      md: "768px",
      xl: "1280px"
    }
  }
});
