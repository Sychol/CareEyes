import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 

export default function SettingsPage() {
  const navigate = useNavigate();

  const [config, setConfig] = useState({
    suppression_seconds: 600,
    delay: 0.5,
    conf_threshold: 0.3,
    save_route: "None",
    save_classes: ["person", "vehicle"], // 기본값
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const allClasses = ["person", "vehicle", "bird", "mammal"];
  const saveRoutes = ["None", "ncloud", "local"];

  useEffect(() => {
    axios.get("/ai/config")
      .then((res) => {
        setConfig(prevConfig => ({
          ...prevConfig,
          ...res.data
        }));
      })
      .catch(err => {
        console.error("❌ 설정값 불러오기 실패:", err);
        alert("설정값을 불러오는 데 실패했습니다.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const toggleClass = (className) => {
    const updated = config.save_classes.includes(className)
      ? config.save_classes.filter((c) => c !== className)
      : [...config.save_classes, className];
    setConfig({ ...config, save_classes: updated });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' || type === 'range' ? parseFloat(value) : value;
    setConfig({ ...config, [name]: newValue });
  };

  const save = () => {
    setIsSaving(true);
    console.log("서버로 전송될 설정값:", config);
    
    axios.post("/ai/config", config)
      .then(() => {
        alert("설정이 성공적으로 저장되었습니다.");
        navigate('/');
      })
      .catch(err => {
        console.error("❌ 설정 저장 실패:", err);
        alert("설정 저장에 실패했습니다. 다시 시도해주세요.");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p className="text-gray-500">설정 정보를 불러오는 중입니다...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg">
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">AI 설정</h2>
            <p className="text-sm text-gray-500 mt-1">시스템의 AI 동작을 제어합니다.</p>
          </div>

          <div className="space-y-6">
            {/* Suppression Seconds */}
            <div>
              <label htmlFor="suppression_seconds" className="block text-sm font-medium text-gray-700 mb-1">Suppression Seconds</label>
              <input
                type="number"
                id="suppression_seconds"
                name="suppression_seconds"
                value={config.suppression_seconds}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Delay */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="delay" className="text-sm font-medium text-gray-700">Delay</label>
                <span className="text-sm font-semibold text-blue-600">{config.delay.toFixed(2)}</span>
              </div>
              <input
                type="range"
                id="delay"
                name="delay"
                min="0"
                max="1"
                step="0.05"
                value={config.delay}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Confidence Threshold */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="conf_threshold" className="text-sm font-medium text-gray-700">Confidence Threshold</label>
                <span className="text-sm font-semibold text-blue-600">{config.conf_threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                id="conf_threshold"
                name="conf_threshold"
                min="0"
                max="1"
                step="0.05"
                value={config.conf_threshold}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* 저장 경로 */}
            <div>
              <label htmlFor="save_route" className="block text-sm font-medium text-gray-700 mb-1">저장 경로</label>
              <select
                id="save_route"
                name="save_route"
                value={config.save_route}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {saveRoutes.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
            </div>
            
            {/* 저장할 클래스 */}
            <fieldset className="border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-700 px-2">저장할 클래스</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {allClasses.map(cls => (
                  <div key={cls} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`class-${cls}`}
                      checked={config.save_classes.includes(cls)}
                      onChange={() => toggleClass(cls)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`class-${cls}`} className="ml-2 text-sm text-gray-600">{cls}</label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-8">
            <button
              onClick={save}
              disabled={isSaving}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSaving ? "저장하는 중..." : "설정 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
