import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileOption } from './types';

interface ProfileSelectorProps {
    profileOptions: ProfileOption[];
    selectedProfile: string;
    onSelectProfile: (profileId: string) => void;
}

export default function ProfileSelector({
    profileOptions,
    selectedProfile,
    onSelectProfile
}: ProfileSelectorProps) {
    return (
        <div className="w-[200px]">
            <Select value={selectedProfile} onValueChange={onSelectProfile}>
                <SelectTrigger>
                    <SelectValue placeholder="选择配置" />
                </SelectTrigger>
                <SelectContent>
                    {profileOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                            {option.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}