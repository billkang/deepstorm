# 后端测试示例

---

## 1. Controller 测试

```java
@WebMvcTest(FormController.class)
@Import({SecurityConfig.class, TestUserConfig.class})
@WithUserDetails(
    value = "admin", userDetailsServiceBeanName = "testUserDetailsService")
@ActiveProfiles("test")
class FormControllerTest {
  @Autowired private MockMvc mvc;
  @Autowired private ObjectMapper objectMapper;
  @MockitoBean private FormService service;

  @Test
  void shouldReturnNotFound_whenFormDoesNotExist() throws Exception {
    when(service.getForm(1L, 2L))
        .thenThrow(new NotFoundException("表单不存在", new ResourceInfo("Form", 2L)));
    mvc.perform(get("/api/v1/apps/1/forms/2"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value(404))
        .andExpect(jsonPath("$.message").value("表单不存在"));
  }

  @Test
  void shouldPublishForm() throws Exception {
    var request = new PublishFormRequest(List.of(control), List.of());
    when(service.publishForm(
        eq(1L), eq(2L), any(PublishFormRequest.class)))
        .thenReturn(FormMapper.INSTANCE.mapToDetails(form));
    mvc.perform(post("/api/v1/apps/1/forms/2:publish")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("form1"));
  }
}
```

---

## 2. 多 Controller 测试

```java
@WebMvcTest({ FormController.class, FormRevisionController.class })
@Import({SecurityConfig.class, TestUserConfig.class})
@WithUserDetails(
    value = "admin", userDetailsServiceBeanName = "testUserDetailsService")
@ActiveProfiles("test")
class FormRevisionControllerTest {
  @Autowired private MockMvc mvc;
  @MockitoBean private FormService formService;
  @MockitoBean private FormRevisionService formRevisionService;
}
```

---

## 3. Service 集成测试

```java
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ApplicationServiceTest {
  @Autowired private ApplicationService service;
  @Autowired private ApplicationRepository repository;

  @Test
  void shouldCreateApplication() {
    var request = new CreateApplicationRequest("app1", null, null);
    var dto = service.createApplication(request);
    assertThat(dto.getName()).isEqualTo("app1");
    assertThat(dto.getId()).isNotNull();
  }
}
```

---

## 4. Service 事件测试

```java
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class FormServiceTest {

  @Autowired private FormService formService;
  @MockitoBean private FormRepository formRepository;
  @Autowired private ApplicationEventPublisher eventPublisher;

  @Test
  void should_publish_event_when_delete_form() {
    var captor = ArgumentCaptor.forClass(FormDeletedEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());
    assertThat(captor.getValue().formId()).isEqualTo(1L);
  }
}
```

关键点：
- `ArgumentCaptor` 验证事件发布，不直接 Mock `ApplicationEventPublisher`
- `@Transactional` 确保每个测试回滚，互不干扰
