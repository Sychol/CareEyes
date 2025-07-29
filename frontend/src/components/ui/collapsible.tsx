// 이 코드는 Radix UI의 @radix-ui/react-collapsible를 불러와서
// 간단하고 재사용 가능한 접기/펼치기(Collapsible) 컴포넌트 세트
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
