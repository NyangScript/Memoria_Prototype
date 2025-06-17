
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { ROUTES } from '../constants';

const ReportErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    // Simulate API call
    console.log("Error Report Submitted:", { name, age, region, title, content });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    // Clear form or navigate away after a delay
    setTimeout(() => {
      // navigate(ROUTES.HOME); // Optionally navigate back
      setName(''); setAge(''); setRegion(''); setTitle(''); setContent('');
      setSubmitSuccess(false); // Reset for next submission
    }, 3000);
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <PageLayout title="오류 신고" showBackButton={true} onBack={() => navigate(ROUTES.REPORT)}>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">앱 오류 및 개선사항 제보</h2>
        <p className="text-sm text-gray-500 mb-6">불편사항이나 개선 아이디어를 알려주시면 서비스 발전에 큰 도움이 됩니다.</p>
        
        {submitSuccess ? (
          <div className="text-center py-10">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-xl font-semibold text-green-600">신고가 성공적으로 제출되었습니다!</h3>
            <p className="text-gray-600 mt-2">소중한 의견 감사합니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={labelClass}>이름</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="홍길동" required />
              </div>
              <div>
                <label htmlFor="age" className={labelClass}>나이 (선택)</label>
                <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} placeholder="30" />
              </div>
            </div>
            <div>
              <label htmlFor="region" className={labelClass}>지역 (선택)</label>
              <input type="text" id="region" value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass} placeholder="서울특별시" />
            </div>
            <div>
              <label htmlFor="title" className={labelClass}>신고 제목</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="예: 분석 기능 오류" required />
            </div>
            <div>
              <label htmlFor="content" className={labelClass}>상세 내용</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className={inputClass}
                placeholder="문제 발생 상황, 개선 아이디어 등을 자세히 적어주세요."
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out disabled:opacity-60 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  제출 중...
                </>
              ) : (
                '제출하기'
              )}
            </button>
          </form>
        )}
      </div>
    </PageLayout>
  );
};

export default ReportErrorPage;
