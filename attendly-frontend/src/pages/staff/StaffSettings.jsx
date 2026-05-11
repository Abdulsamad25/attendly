import ProfileSettings from "../../components/ui/ProfileSettings";
import StaffLayout from "./StaffLayout";

const StaffSettings = () => {
  return (
    <StaffLayout>
      <div className="mx-auto p-6 max-w-4xl">
        <ProfileSettings />
      </div>
    </StaffLayout>
  );
};

export default StaffSettings;