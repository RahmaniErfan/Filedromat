import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { resolve } from 'node:path';
import type { ActionPlan } from '../../types/index.js';

interface ActionPlanProps {
  plan: ActionPlan;
  targetPath: string;
  onConfirm: (item: any) => void;
}

const PAGE_SIZE = 10;

export function ActionPlanView({ plan, targetPath, onConfirm }: ActionPlanProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(plan.actions.length / PAGE_SIZE);
  const startIdx = page * PAGE_SIZE;
  const visibleActions = plan.actions.slice(startIdx, startIdx + PAGE_SIZE);

  const handleSelect = (item: any) => {
    if (item.value === 'next') setPage(p => Math.min(p + 1, totalPages - 1));
    else if (item.value === 'prev') setPage(p => Math.max(p - 1, 0));
    else onConfirm(item);
  };

  const options = [
    { value: 'yes', label: 'Yes, apply changes' },
    { value: 'no', label: 'No, cancel' }
  ];

  if (page < totalPages - 1) {
    options.unshift({ value: 'next', label: `Next Page (${page + 1}/${totalPages})` });
  }
  if (page > 0) {
    options.unshift({ value: 'prev', label: 'Previous Page' });
  }

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="blue" paddingX={1} flexDirection="column" marginBottom={1}>
        <Text bold color="blue">Proposed Actions ({plan.actions.length} total)</Text>
        {visibleActions.map((a, i) => (
          <Text key={startIdx + i}>
            {a.sourcePath.split('/').pop()} {'->'} {a.targetPath.replace(resolve(targetPath) + '/', '')}
          </Text>
        ))}
        {plan.actions.length > PAGE_SIZE && (
          <Text dimColor>--- Page {page + 1} of {totalPages} ---</Text>
        )}
      </Box>
      <Text>Apply this organization plan?</Text>
      <SelectInput
        items={options}
        onSelect={handleSelect}
      />
    </Box>
  );
}
