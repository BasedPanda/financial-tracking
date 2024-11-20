// ExpenseChart.jsx
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Card from '../../common/Card';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

const ExpenseChart = ({ expenses = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const data = expenses.map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: COLORS[index % COLORS.length],
  }));

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <Card
      title="Expense Distribution"
      subtitle="Monthly Spending by Category"
      className="h-full"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? '#fff' : 'none'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(value)
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        <h4 className="text-center font-medium text-gray-900">
          Total Expenses:{' '}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(total)}
        </h4>
      </div>
    </Card>
  );
};

export default ExpenseChart;