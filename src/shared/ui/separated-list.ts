import { css } from "../../../styled-system/css";

const separatedArticleListStyle = css({
  "& > article + article": {
    borderColor: "border",
    borderTopWidth: "1px"
  }
});

export { separatedArticleListStyle };
