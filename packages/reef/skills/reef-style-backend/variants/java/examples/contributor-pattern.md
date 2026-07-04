# Reference Contributor 模式

当删除资源前需要查询哪些其他资源引用了它时，使用 Contributor 模式。

## 定义接口

在被引用资源所属模块中定义 `@FunctionalInterface`：

```java
// data/service/DataObjectReferenceContributor.java
@FunctionalInterface
public interface DataObjectReferenceContributor {
  List<ResourceSummary> findReferences(Long dataObjectId);
}
```

统一返回值（`base/dto/` 中定义）：

```java
public record ResourceSummary(String type, Long id, Long name) {}
public record ListResourceReferencesResponse(List<ResourceSummary> references) {}
```

## 实现贡献者

引用方模块实现接口为 `@Component`，Spring 自动收集：

```java
@Component
@RequiredArgsConstructor
public class PageDataObjectReferenceContributor
    implements DataObjectReferenceContributor {
  private final PageRepository repository;

  @Override
  public List<ResourceSummary> findReferences(Long dataObjectId) {
    return repository
        .findAllByTableComponentDataObjectId(dataObjectId)
        .stream()
        .map(page -> new ResourceSummary("Page", page.getId(), page.getName()))
        .toList();
  }
}
```

多途径查找时用 `Stream.of(...).flatMap(List::stream).distinct()` 去重合并：

```java
@Override
public List<ResourceSummary> findReferences(Long datasetId) {
  var streams = Stream.of(
      repository.findAllByChartDatasetId(datasetId),
      repository.findAllByTableComponentDatasetId(datasetId));
  return streams
      .flatMap(List::stream)
      .map(entity -> new ResourceSummary("Type", entity.getId(), entity.getName()))
      .distinct()
      .toList();
}
```

## Repository 查询

继承层次中的子类型查询使用 `TREAT` 语法：

```java
@Query(
    """
    SELECT DISTINCT p FROM Page p JOIN p.components c
    WHERE TREAT(c AS TableComponent).customDataConfig.dataObjectId = :dataObjectId
    """)
List<Page> findAllByTableComponentDataObjectId(Long dataObjectId);
```

## 聚合查询（Owner Service）

```java
private final List<DataObjectReferenceContributor> referenceContributors;

public ListResourceReferencesResponse listDataObjectReferences(Long appId, Long dataObjectId) {
  getDataObjectEntity(appId, dataObjectId); // 验证存在 + 多租户
  var references = referenceContributors.stream()
      .flatMap(contributor -> contributor.findReferences(dataObjectId).stream())
      .toList();
  return new ListResourceReferencesResponse(references);
}
```

## REST 端点

```java
@GetMapping("/{objectId}/references")
public ListResourceReferencesResponse listDataObjectReferences(
    @PathVariable Long appId, @PathVariable Long objectId) {
  return service.listDataObjectReferences(appId, objectId);
}
```
