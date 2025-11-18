import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00aaff",
    },
    secondary: {
      main: "#ff6f61",
    },
    background: {
      default: "#0b1320",
      paper: "#121c2b",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});
