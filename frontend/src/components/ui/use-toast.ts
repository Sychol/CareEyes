// useToast랑 toast라는 커스텀 훅/함수를 한 번 더 외부로 재수출(export) 해주는 간단한 re-export 코드
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };
