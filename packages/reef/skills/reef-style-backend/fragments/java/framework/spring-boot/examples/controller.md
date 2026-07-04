# 后端 Controller 示例

---

## 1. 标准 Controller（CRUD + 自定义方法）

```java
@RestController
@RequestMapping("/api/v1/apps/{appId}/forms")
@AllArgsConstructor
public class FormController {
  private final FormService service;

  @GetMapping
  public ListFormsResponse listForms(@PathVariable Long appId) {
    return service.listForms(appId);
  }

  @GetMapping("/{formId}")
  public FormDetailsDto getForm(
      @PathVariable Long appId, @PathVariable Long formId) {
    return service.getForm(appId, formId);
  }

  @PostMapping
  public FormDetailsDto createForm(
      @PathVariable Long appId, @Valid @RequestBody CreateFormRequest request) {
    return service.createForm(appId, request);
  }

  @PatchMapping("/{formId}")
  public FormDetailsDto updateForm(
      @PathVariable Long appId,
      @PathVariable Long formId,
      @Valid @RequestBody UpdateFormRequest request) {
    return service.updateForm(appId, formId, request);
  }

  @DeleteMapping("/{formId}")
  public void deleteForm(
      @PathVariable Long appId, @PathVariable Long formId) {
    service.deleteForm(appId, formId);
  }

  // AIP-136 自定义方法：冒号语法
  @PostMapping("/{formId}:publish")
  public FormDetailsDto publishForm(
      @PathVariable Long appId,
      @PathVariable Long formId,
      @RequestBody PublishFormRequest request) {
    return service.publishForm(appId, formId, request);
  }
}
```

---

## 2. Controller 含 @AuthenticationPrincipal

```java
@RestController
@RequestMapping("/api/v1/apps/{appId}/forms/{formId}")
@AllArgsConstructor
public class FormResponseController {
  private final FormResponseService service;

  @GetMapping("/responses")
  public ListFormResponsesResponse listFormResponses(
      @PathVariable Long appId,
      @PathVariable Long formId,
      @AuthenticationPrincipal User user) {
    return service.listFormResponses(appId, formId, user);
  }

  @PostMapping("/responses")
  public FormResponseDto createFormResponse(
      @PathVariable Long appId,
      @PathVariable Long formId,
      @RequestBody CreateFormResponseRequest request,
      @AuthenticationPrincipal User user) {
    return service.createFormResponse(appId, formId, request, user);
  }

  // AIP-136 自定义方法
  @PostMapping("/responses/{responseId}:approve")
  public FormResponseDto approveFormResponse(
      @PathVariable Long appId,
      @PathVariable Long formId,
      @PathVariable Long responseId,
      @RequestBody ApproveFormResponseRequest request,
      @AuthenticationPrincipal User user) {
    return service.approveFormResponse(appId, formId, responseId, request, user);
  }
}
```
