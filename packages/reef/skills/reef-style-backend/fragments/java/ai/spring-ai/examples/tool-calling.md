# Spring AI Tool 调用示例

## 基本 Tool

```java
@Service
public class OrderTools {

  /**
   * 查询用户订单列表
   */
  @Tool(description = "根据用户 ID 查询订单列表")
  public List<OrderDTO> getOrdersByUser(
      @ToolParam(description = "用户 ID，数字格式") Long userId) {
    // 实际调用 OrderService
    return orderService.findByUserId(userId);
  }

  /**
   * 获取订单详情
   */
  @Tool(description = "根据订单 ID 查询订单详情")
  public OrderDTO getOrderDetail(
      @ToolParam(description = "订单 ID") Long orderId) {
    return orderService.findById(orderId);
  }
}
```

## 带权限校验的 Tool

```java
@Service
public class SecureTools {

  private final SecurityContext securityContext;

  @Tool(description = "创建新订单")
  public OrderDTO createOrder(
      @ToolParam(description = "订单创建请求") CreateOrderRequest request) {
    // 权限校验
    User currentUser = securityContext.getCurrentUser();
    if (!currentUser.hasPermission("order:create")) {
      throw new SecurityException("无创建订单权限");
    }
    return orderService.create(request, currentUser.getId());
  }
}
```

## Tool 注册

```java
@Configuration
public class ToolConfig {

  private final OrderTools orderTools;
  private final UserTools userTools;

  @Bean
  ChatClient assistantChatClient(ChatClient.Builder builder) {
    return builder
      .defaultSystem("你是订单管理助手")
      .defaultTools(orderTools, userTools)  // 注册所有 Tool
      .build();
  }
}
```
