
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import ActivityCard from '../components/ActivityCard';
import { useBehaviorLogs } from '../contexts/BehaviorLogContext';
import { BehaviorType, CategoryActivityData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ROUTES } from '../constants';

const AbnormalLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { getLogsByType, getBehaviorCategoryActivity } = useBehaviorLogs();
  const abnormalLogs = getLogsByType(BehaviorType.ABNORMAL);
  const categoryData: CategoryActivityData[] = getBehaviorCategoryActivity(BehaviorType.ABNORMAL);

  const formatXAxisTick = (tick: string) => {
    const maxLength = 10; 
    if (tick.length > maxLength) {
      return `${tick.substring(0, maxLength)}...`;
    }
    return tick;
  };

  return (
    <PageLayout title="이상행동 기록" showBackButton={true} onBack={() => navigate(ROUTES.HOME)}>
      <div className="space-y-6">
        {/* Chart Section */}
        {categoryData.length > 0 ? (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">이상행동 분류별 빈도</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={categoryData} 
                margin={{ top: 5, right: 20, left: -20, bottom: 50 }} // Increased bottom margin
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="category"
                  tick={{ fontSize: 10 }} 
                  interval={0} 
                  // angle={-30} // Removed angle
                  textAnchor="middle" // Changed textAnchor to middle
                  tickFormatter={formatXAxisTick} 
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  wrapperStyle={{ fontSize: "14px" }}
                  formatter={(value, name, props) => [`${value}회`, props.payload.category]}
                  labelFormatter={() => ''} 
                />
                <Legend wrapperStyle={{ fontSize: "14px" }} />
                <Bar dataKey="count" fill="#FBBF24" name="횟수" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
           <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <p className="text-gray-600">지난 기록 중 차트에 표시할 이상행동 데이터가 없습니다.</p>
          </div>
        )}

        {/* Log List Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">최근 이상행동 기록</h2>
          {abnormalLogs.length > 0 ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {abnormalLogs.map(log => (
                <ActivityCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">최근 이상행동 기록이 없습니다.</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default AbnormalLogPage;