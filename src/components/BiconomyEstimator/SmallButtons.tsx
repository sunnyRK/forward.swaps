import React from "react";

export interface SmallButtonsProps {
  name: string;
  active?: boolean;
  onClick?:
    | ((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void)
    | undefined;
}

const SmallButtons: React.FunctionComponent<SmallButtonsProps> = ({
  name,
  active,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={
        "small-button" + " " + `${active === true ? "active-token" : ""}`
      }
    >
      <div
        className="icon"
        style={{
          backgroundImage: `url(/assets/${name}.png)`,
          backgroundSize: "cover",
        }}
      ></div>
      <div className="name">{name}</div>
    </div>
  );
};

export default SmallButtons;
