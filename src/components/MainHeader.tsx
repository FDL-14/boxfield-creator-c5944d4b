
import React from "react";
import MainMenuButton from "@/components/MainMenuButton";

interface MainHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

const MainHeader: React.FC<MainHeaderProps> = ({ title, subtitle, rightContent }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4">
        <MainMenuButton />
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center gap-4">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default MainHeader;
