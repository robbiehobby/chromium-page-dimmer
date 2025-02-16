module.exports = {
  content: ["public/**/*.html"],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes").light,
          primary: "#fdbd4c",
          secondary: "#5d5ce6",
          neutral: "#ced4da",
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes").dark,
          primary: "#dbae59",
          secondary: "#5d5ce6",
          neutral: "#3b4042",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
};
