import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectOption } from '@/components/common/Select';
import { IPropertyCondition, IBodyCondition, MatchOperator } from '@service-bus-explorer/shared';

interface ConditionBuilderProps {
  propertyConditions: IPropertyCondition[];
  bodyConditions: IBodyCondition[];
  onPropertyConditionsChange: (conditions: IPropertyCondition[]) => void;
  onBodyConditionsChange: (conditions: IBodyCondition[]) => void;
}

const OPERATORS: { value: MatchOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'regex', label: 'Regex Match' },
  { value: 'exists', label: 'Exists' },
];

const COMMON_PROPERTIES = [
  'messageId',
  'correlationId',
  'sessionId',
  'subject',
  'contentType',
  'to',
  'replyTo',
];

export function ConditionBuilder({
  propertyConditions,
  bodyConditions,
  onPropertyConditionsChange,
  onBodyConditionsChange,
}: ConditionBuilderProps) {
  // Property condition handlers
  const addPropertyCondition = () => {
    onPropertyConditionsChange([
      ...propertyConditions,
      { property: '', operator: 'equals', value: '' },
    ]);
  };

  const updatePropertyCondition = (index: number, updates: Partial<IPropertyCondition>) => {
    const newConditions = [...propertyConditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onPropertyConditionsChange(newConditions);
  };

  const removePropertyCondition = (index: number) => {
    onPropertyConditionsChange(propertyConditions.filter((_, i) => i !== index));
  };

  // Body condition handlers
  const addBodyCondition = () => {
    onBodyConditionsChange([
      ...bodyConditions,
      { jsonPath: '', operator: 'equals', value: '' },
    ]);
  };

  const updateBodyCondition = (index: number, updates: Partial<IBodyCondition>) => {
    const newConditions = [...bodyConditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onBodyConditionsChange(newConditions);
  };

  const removeBodyCondition = (index: number) => {
    onBodyConditionsChange(bodyConditions.filter((_, i) => i !== index));
  };

  const needsValue = (operator: MatchOperator) => operator !== 'exists';

  return (
    <div className="space-y-6">
      {/* Property Conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Message Property Conditions</h3>
          <Button variant="outline" size="sm" onClick={addPropertyCondition}>
            <Plus className="mr-1 h-3 w-3" />
            Add Property
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Match against standard message properties or application properties
        </p>

        {propertyConditions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            No property conditions. Click "Add Property" to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {propertyConditions.map((condition, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    value={condition.property}
                    onChange={(e) =>
                      updatePropertyCondition(index, { property: e.target.value })
                    }
                    placeholder="e.g., correlationId or applicationProperties.EventName"
                    list={`property-suggestions-${index}`}
                  />
                  <datalist id={`property-suggestions-${index}`}>
                    {COMMON_PROPERTIES.map((prop) => (
                      <option key={prop} value={prop} />
                    ))}
                    <option value="applicationProperties.EventName" />
                    <option value="applicationProperties.EventType" />
                  </datalist>
                </div>
                <Select
                  value={condition.operator}
                  onChange={(e) =>
                    updatePropertyCondition(index, {
                      operator: e.target.value as MatchOperator,
                    })
                  }
                  className="w-32"
                >
                  {OPERATORS.map((op) => (
                    <SelectOption key={op.value} value={op.value}>
                      {op.label}
                    </SelectOption>
                  ))}
                </Select>
                {needsValue(condition.operator) && (
                  <Input
                    value={String(condition.value ?? '')}
                    onChange={(e) =>
                      updatePropertyCondition(index, { value: e.target.value })
                    }
                    placeholder="Value"
                    className="w-40"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removePropertyCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body Conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Message Body Conditions</h3>
          <Button variant="outline" size="sm" onClick={addBodyCondition}>
            <Plus className="mr-1 h-3 w-3" />
            Add Body Field
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Match against JSON body fields using dot notation (e.g., data.candidateId)
        </p>

        {bodyConditions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            No body conditions. Click "Add Body Field" to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {bodyConditions.map((condition, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={condition.jsonPath}
                  onChange={(e) =>
                    updateBodyCondition(index, { jsonPath: e.target.value })
                  }
                  placeholder="e.g., data.event.type"
                  className="flex-1"
                />
                <Select
                  value={condition.operator}
                  onChange={(e) =>
                    updateBodyCondition(index, {
                      operator: e.target.value as MatchOperator,
                    })
                  }
                  className="w-32"
                >
                  {OPERATORS.map((op) => (
                    <SelectOption key={op.value} value={op.value}>
                      {op.label}
                    </SelectOption>
                  ))}
                </Select>
                {needsValue(condition.operator) && (
                  <Input
                    value={String(condition.value ?? '')}
                    onChange={(e) =>
                      updateBodyCondition(index, { value: e.target.value })
                    }
                    placeholder="Value"
                    className="w-40"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeBodyCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {(propertyConditions.length > 0 || bodyConditions.length > 0) && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <strong>Total:</strong> {propertyConditions.length + bodyConditions.length} condition(s)
        </div>
      )}
    </div>
  );
}
