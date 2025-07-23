package com.careeyes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import jakarta.servlet.DispatcherType;

@Configuration // autoScan해서 Spring Container에 적재 필요
@EnableWebSecurity // 해당 클래스 파일이 webSecurity 설정 파일이 될 수 있도록 추가
public class SecurityConfig {
	// 커스터마이징할 필터(거름망) 제작 -> 코드를 체인 형태로 작성(연결 -> 연결)
	
	// Bean 어노테이션을 사용해서 Spring Container에 클래스로 등록
	// Bean : Spring에서 객체 생성 시 사용
	//		  Bean == 객체(개발자 입장에서 제어가 불가능한 라이브러리를 변경할 때 사용)
	@Bean // 클래스 안에 또 다른 클래스를 제작하는 형태(inner class)
	SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		// 모든 예외처리를 받아서 try-catch문 대신 Spring에서 처리할 수 있도록 throws 사용
		// 인증, 인가에 대한 설정 처리
		
		// http.cors().disable(); -> deprecated(더이상 사용 X)
		// -> CORS (Cross-Origing Resource Sharing policy, 동일출처정책)
		//	  동일 출처에서 오는 요청만 데이터(리소스) 공유 가능
		// -> 실습하고 있기 때문에 CORS를 사용하지 않겠다는 설정 추가
		
		/* CSRF : Cross Site Request Forgery (사이트 간 위조 요청)
		 * 	-> 사용자가 클릭하면 의도하지 않은 액션(자금이체, pw변경 등) 실행
		 */
		
		// 방법 1)
		// http.cors((cors) -> cors.disable()); // 람다식 사용 추세
		
		// 방법 2)
		http.cors(AbstractHttpConfigurer :: disable)
			.csrf(AbstractHttpConfigurer :: disable)
			.authorizeHttpRequests((request)
					// 람다식 기술(권한에 대한 설정 진행 메서드)
					// 포워드 방식으로 이동한 요청 허용
					-> request.dispatcherTypeMatchers(DispatcherType.FORWARD)
					// 포워드 방식으로 이동한 요청은 인증 없이 이동 허용
					.permitAll()
					// 특정 URL에 대해서는 인증받지 않더라도 접근 허용
					.requestMatchers("/join", "/join-process").permitAll()
					.requestMatchers("/api/**").permitAll()
					// 특정 권한에 따라서 부여되는 페이지 접근 권한
					.requestMatchers("/admin").hasRole("관리자")
					.requestMatchers("/user").hasRole("사용자")
					//어떤 요청이 들어와도 인증 받도록 함
					.anyRequest().authenticated())
			
			// 아래의 코드를 작성하면 Spring에서 제작한 필터가 나오지 않고,
			// loginPage("URL")로 요청한 페이지가 나옴(id는 user, pw는 콘솔의 security password로 로그인)
			.formLogin((logininfo) -> logininfo.loginPage("/login")
					// 사용자가 로그인을 안 한 상태 -> "/"주소의 html 보여줌
					// 로그인 폼에서 로그인 버튼 클릭하면 아래의 "/login-process"로 요청
					.loginProcessingUrl("/login-process")
					.usernameParameter("userid")
					.passwordParameter("userpw")
					.defaultSuccessUrl("/main")
					.permitAll());
		
		/* 권한을 설정할 때, 사용 가능한 메서드
		 * 1) permitAll() : 모든 접근 허용
		 * 2) authenticated() : 인증된 사용자만 접근 허용
		 * 3) hasRole("권한, 역할") : 특정 역할 사용자만 접근 허용
		 */
		
		return http.build();
	}
	
	@Bean
	public PasswordEncoder passwordEncoder() {
		// 1) return new MyPasswordEncoder()
		//		-> 직접 설계한 암호화 알고리즘 사용할 때, 리턴값
		// 2) 이미 만들어진 암호화 알고리즘 사용할 때 방식
		return new BCryptPasswordEncoder();
	}
	
}
