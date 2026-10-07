import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import Signup from '@/screens/Signup';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, authIntent } = useAuthStore();
  return <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
    <DialogContent className="auth-dialog p-0 gap-0 overflow-y-auto border-0">
      <DialogTitle className="sr-only">Sign in to Bnoy Studios</DialogTitle>
      <DialogDescription className="sr-only">Access your Bnoy Studios account.</DialogDescription>
      <Signup embedded intent={authIntent} onSuccess={() => setShowAuthModal(false)} />
    </DialogContent>
  </Dialog>;
}
