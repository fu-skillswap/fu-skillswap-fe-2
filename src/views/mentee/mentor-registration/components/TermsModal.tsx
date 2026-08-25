/**
 * @file TermsModal.tsx
 * @description Sub-component Modal hiển thị Điều khoản vận hành của SkillSwap cho Mentor.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Điều khoản vận hành của SkillSwap">
      <div
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          paddingRight: '8px',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#334155',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '12px', color: '#0f172a' }}>
          1. Quy định dành cho Mentor
        </h3>
        <p>
          - Mentor cam kết cung cấp thông tin trung thực, chính xác về trình độ chuyên môn, kinh
          nghiệm làm việc và kỹ năng hướng dẫn.
          <br />- Đảm bảo giữ đúng lịch hẹn và tư vấn nhiệt tình, văn minh với Mentee.
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '12px', color: '#0f172a' }}>
          2. Quy trình Xác thực & Duyệt Hồ sơ
        </h3>
        <p>
          - Hồ sơ đăng ký làm Mentor sau khi gửi sẽ được Ban quản trị (Admin) kiểm tra và duyệt dựa
          trên các tiêu chuẩn chất lượng của nền tảng.
          <br />- Nền tảng có quyền từ chối hoặc tạm khóa quyền Mentor nếu phát hiện thông tin giả
          mạo hoặc vi phạm tiêu chuẩn cộng đồng.
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '12px', color: '#0f172a' }}>
          3. Quyền sở hữu và Bảo mật
        </h3>
        <p>
          - Tôn trọng và bảo mật thông tin cá nhân cũng như nội dung trao đổi giữa Mentor và Mentee.
          <br />- Không sử dụng thông tin của nền tảng cho mục đích lừa đảo, thương mại hóa trái
          phép.
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Button onClick={onClose}>Tôi đã hiểu</Button>
      </div>
    </Modal>
  );
}
