import React from 'react';
import { ReportIssueModal } from './ReportIssueModal';

interface ReportFraudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportFraudModal: React.FC<ReportFraudModalProps> = ({ isOpen, onClose }) => {
  return <ReportIssueModal isOpen={isOpen} onClose={onClose} />;
};
