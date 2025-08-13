import { QrCodeGenerator } from "@/components/qr-code-generator";
import { CheckInManager } from "@/components/check-in-manager";
import { Separator } from "@/components/ui/separator";

export default function QrCodesPage() {
    return (
        <div className="space-y-8">
            <QrCodeGenerator />
            <Separator />
            <CheckInManager />
        </div>
    )
}
