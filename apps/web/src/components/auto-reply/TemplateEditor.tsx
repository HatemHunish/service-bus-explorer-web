import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { useTestTemplate } from '@/hooks';
import { toast } from '@/components/common/Toaster';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  contentType: string;
}

const VARIABLE_SECTIONS = [
  {
    title: 'System Variables',
    variables: [
      { name: '{{$uuid}}', description: 'Generate a new UUID' },
      { name: '{{$timestamp}}', description: 'Current timestamp (milliseconds)' },
      { name: '{{$isoTimestamp}}', description: 'Current ISO timestamp' },
    ],
  },
  {
    title: 'Message Properties',
    variables: [
      { name: '{{messageId}}', description: 'Original message ID' },
      { name: '{{correlationId}}', description: 'Correlation ID' },
      { name: '{{sessionId}}', description: 'Session ID' },
      { name: '{{subject}}', description: 'Message subject/label' },
      { name: '{{contentType}}', description: 'Content type' },
      { name: '{{sequenceNumber}}', description: 'Sequence number' },
      { name: '{{enqueuedTime}}', description: 'Enqueued time (ISO format)' },
    ],
  },
  {
    title: 'Application Properties',
    variables: [
      { name: '{{properties.EventName}}', description: 'Custom property: EventName' },
      { name: '{{properties.EventType}}', description: 'Custom property: EventType' },
      { name: '{{properties.YourProperty}}', description: 'Use any custom property name' },
    ],
  },
  {
    title: 'Body Fields',
    variables: [
      { name: '{{body.fieldName}}', description: 'Access any JSON field' },
      { name: '{{body.data.id}}', description: 'Nested field access' },
      { name: '{{body.items[0]}}', description: 'Array element access' },
    ],
  },
];

const DEFAULT_SAMPLE_BODY = `{
  "commandId": "sample-command-id",
  "commandName": "createCandidate",
  "correlationId": "sample-correlation-id",
  "data": {
    "id": "data-789",
    "name": "Sample Data"
  }
}`;

export function TemplateEditor({ value, onChange, contentType }: TemplateEditorProps) {
  const [showVariables, setShowVariables] = useState(true);
  const [showSampleBody, setShowSampleBody] = useState(false);
  const [sampleBody, setSampleBody] = useState(DEFAULT_SAMPLE_BODY);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Message Properties']);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testErrors, setTestErrors] = useState<string[] | null>(null);
  const testTemplate = useTestTemplate();

  const getLanguage = () => {
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';
    return 'plaintext';
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const copyVariable = async (variable: string) => {
    await navigator.clipboard.writeText(variable);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const insertVariable = (variable: string) => {
    // Append to end for simplicity - in a real app, you'd insert at cursor
    onChange(value + variable);
  };

  const handleTest = async () => {
    // Parse the sample body
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(sampleBody);
    } catch {
      toast('Invalid JSON in sample body', 'destructive');
      return;
    }

    try {
      const result = await testTemplate.mutateAsync({
        template: value,
        sampleMessage: {
          messageId: 'sample-msg-123',
          correlationId: 'corr-456',
          subject: 'TestEvent',
          contentType: 'application/json',
          applicationProperties: {
            EventName: 'SampleEvent',
            EventType: 'Test',
            commandName: (parsedBody as any)?.commandName || 'TestCommand',
          },
          body: parsedBody,
        },
      });

      setTestErrors(result.errors || null);
      setTestResult(result.result);

      if (result.errors && result.errors.length > 0) {
        toast(`Template has unresolved variables`, 'destructive');
      } else {
        toast('Template test successful', 'default');
      }
    } catch (err) {
      toast(`Test failed: ${(err as Error).message}`, 'destructive');
    }
  };

  return (
    <div className="mt-1 space-y-2">
      <div className="flex gap-4">
        {/* Editor */}
        <div className="flex-1 rounded-lg border overflow-hidden">
          <Editor
            height="250px"
            language={getLanguage()}
            value={value}
            onChange={(val) => onChange(val || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              fontSize: 13,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        </div>

        {/* Variables Sidebar */}
        {showVariables && (
          <div className="w-64 rounded-lg border bg-muted/30 overflow-y-auto max-h-[250px]">
            <div className="p-2 border-b font-medium text-sm">Available Variables</div>
            <div className="p-2 space-y-2">
              {VARIABLE_SECTIONS.map((section) => (
                <div key={section.title}>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center gap-1 text-xs font-medium hover:text-primary"
                  >
                    {expandedSections.includes(section.title) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {section.title}
                  </button>
                  {expandedSections.includes(section.title) && (
                    <div className="mt-1 ml-3 space-y-1">
                      {section.variables.map((v) => (
                        <div
                          key={v.name}
                          className="group flex items-center justify-between rounded px-1 py-0.5 hover:bg-muted"
                        >
                          <button
                            onClick={() => insertVariable(v.name)}
                            className="text-left text-xs"
                            title={v.description}
                          >
                            <code className="text-primary">{v.name}</code>
                          </button>
                          <button
                            onClick={() => copyVariable(v.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy to clipboard"
                          >
                            {copiedVariable === v.name ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVariables(!showVariables)}
          >
            {showVariables ? 'Hide Variables' : 'Show Variables'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSampleBody(!showSampleBody)}
          >
            {showSampleBody ? 'Hide Sample Body' : 'Edit Sample Body'}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleTest} disabled={testTemplate.isPending}>
          {testTemplate.isPending ? 'Testing...' : 'Test Template'}
        </Button>
      </div>

      {/* Sample Body Editor */}
      {showSampleBody && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium">Sample Message Body (JSON)</span>
            <button
              onClick={() => setSampleBody(DEFAULT_SAMPLE_BODY)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset to Default
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Edit this to match your actual message structure for accurate testing.
          </p>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
            rows={8}
            value={sampleBody}
            onChange={(e) => setSampleBody(e.target.value)}
            placeholder="Enter sample message body JSON..."
          />
        </div>
      )}

      {/* Test Result */}
      {(testResult || testErrors) && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium">Test Result Preview:</span>
            <button
              onClick={() => { setTestResult(null); setTestErrors(null); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          {testErrors && testErrors.length > 0 && (
            <div className="mb-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
              <strong>Errors:</strong>
              <ul className="mt-1 ml-4 list-disc">
                {testErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {testResult && (
            <pre className="text-xs whitespace-pre-wrap font-mono bg-background rounded p-2 max-h-32 overflow-y-auto">
              {testResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
